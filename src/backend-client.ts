import axios from "axios";
import { BASE_URL } from "./constants";

export type MoveCommand = "forward" | "backward" | "turn_left" | "turn_right" | "stop" | "stop_motors"


export const backendClient = axios.create({
  baseURL: BASE_URL,
});

export async function moveRobot(command: MoveCommand) {
    await backendClient.post('/control-robot', {
        action: command
    })
}
