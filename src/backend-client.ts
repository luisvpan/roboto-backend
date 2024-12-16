import axios, { AxiosResponse } from "axios";
import { BASE_URL } from "./constants";
import { CurrentStatus, MovementMode, RawCurrentStatus } from "./types";

export type MoveCommand = "forward" | "backward" | "turn_left" | "turn_right" | "stop" | "stop_motors"


export const backendClient = axios.create({
  baseURL: BASE_URL,
});

export async function moveRobot(command: MoveCommand): Promise<CurrentStatus> {
    const response = await backendClient.post<MovementResponse>('/control-robot', {
        action: command
    })

    if (response.data.status !== "success") {
        throw new Error("Error sending command to robot")
    }

    return formatCurrentStatus(response.data.current_status)
}

export async function changeSpeed(movement_speed: number): Promise<CurrentStatus> {
    const response = await backendClient.put<MovementResponse>('/change-speed', {
        movement_speed
    })

    if (response.data.status !== "success") {
        throw new Error("Error changing speed")
    }

    return formatCurrentStatus(response.data.current_status)
}

export async function changeMode(movement_mode: MovementMode): Promise<CurrentStatus> {
    const response = await backendClient.put<ChangeModeResponse>('/change-mode', {
        movement_mode
    })

    if (response.data.status !== "success") {
        throw new Error("Error changing mode")
    }

    return formatCurrentStatus(response.data.current_status)
}

export async function getCurrentStatus(): Promise<CurrentStatus> {
    const response = await backendClient.get<CurrentStatusResponse>('/current-status')

    if (response.data.status !== "success") {
        throw new Error("Error getting current status")
    }

    return formatCurrentStatus(response.data.current_status)
}


function formatCurrentStatus(rawCurrentStatus: RawCurrentStatus): CurrentStatus {
    return {
        movementMode: rawCurrentStatus.movement_mode,
        running: rawCurrentStatus.running,
        movementSpeed: rawCurrentStatus.movement_speed
    }
}

export interface MovementResponse {
    status: string;
    command: string;
    current_status: RawCurrentStatus;
}

export interface CurrentStatusResponse {
    status: string;
    current_status: RawCurrentStatus;
}

export interface SpeedResponse {
    movement_speed: number;
    status: string;
    current_status: RawCurrentStatus;
}

export interface ChangeModeResponse {
    status: string;
    mode: MovementMode;
    current_status: RawCurrentStatus;
}