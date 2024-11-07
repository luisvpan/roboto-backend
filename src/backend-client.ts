import axios from "axios";

export type MoveCommand = "forward" | "backward" | "turn_left" | "turn_right" | "stop" | "stop_motors"

export const backendClient = axios.create({
  baseURL: "http://10.68.17.134:8000/",
});


export async function moveRobot(command: MoveCommand) {
    await backendClient.post('/control-robot', {
        action: command
    })
}