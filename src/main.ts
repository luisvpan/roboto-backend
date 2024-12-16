import { Request, Response } from "express";
import { Socket } from "socket.io";
import { changeMode, changeSpeed, getCurrentStatus, MoveCommand, moveRobot } from "./backend-client";
import { initServer } from './bootstrap/server';
import { LocationData, RawLocationData, Coords, CurrentStatus, MovementMode } from './types';
import { isValidJson } from "./helpers";

const { gpsSocket, cameraSocket, io } = initServer();

let lastBotVideoFrame: string = "";
let lastBotLocationData: LocationData = {
  coors: {
    latitude: 0,
    longitude: 0
  },
  orientation: 0,
  speed: 0 // Esta es la velocidad "real" recibida desde el GPS
}
let lastBotCurrentStatus: CurrentStatus = {
  movementMode: MovementMode.CONTROL,
  running: false,
  movementSpeed: 0 // Esta (si se llegara a implementar) es la velocidad "teorica" establecida para el bot
}
const clientsPool: Socket[] = [];
//const coorsQueues: Coords[] = []; <--- for the path mode
const targetCoords: Coords = { latitude: 0, longitude: 0 };

gpsSocket.onmessage = (event) => {
  const txtJson = event.data.toString();
  if (!isValidJson(txtJson)) {
    console.error("Invalid JSON data on GPS socket");
    return;
  }

  const data: RawLocationData = JSON.parse(txtJson);
  const coords: Coords = {
    longitude: data.coordinates.coordinates[0],
    latitude: data.coordinates.coordinates[1],
  };

  lastBotLocationData = {
    coors: coords,
    orientation: data.orientation,
    speed: data.speed
  }
  //console.log("GPS Data", lastBotLocationData);

  clientsPool.forEach((socket) => {
    socket.emit("receive-gps-update", coords);
    socket.emit("receive-gps-speed", data.speed);
    socket.emit("receive-gps-orientation", data.orientation);
  });

};

cameraSocket.onmessage = (event) => {
  const base64Image = event.data.toString();

  clientsPool.forEach((socket) => {
    lastBotVideoFrame = base64Image;
    socket.emit("receive-video-stream", base64Image);
  });
}

// Escuchar conexiones de socket
io.on("connection", async (socket) => {
  clientsPool.push(socket);
  lastBotCurrentStatus = await getCurrentStatus();
  socket.emit("receive-current-status", lastBotCurrentStatus);

  socket.on("move", async (command: MoveCommand) => {
    console.log(`Dirección recibida: ${JSON.stringify(command)}`);
    lastBotCurrentStatus = await moveRobot(command);
    socket.emit("receive-current-status", lastBotCurrentStatus);
  });

  // Esto cambia la velocidad teorica si llegase a implementarse en el frontend y el python
  socket.on("speed", async (speed: number) => {
    console.log(`Velocidad recibida: ${speed}`);
    lastBotCurrentStatus = await changeSpeed(speed);
    socket.emit("receive-current-status", lastBotCurrentStatus);
  });

  // Cambiar el modo
  socket.on("change-mode", async (mode: MovementMode) => {
    console.log(`Modo recibido: ${mode}`);
    lastBotCurrentStatus = await changeMode(mode);
    socket.emit("receive-current-status", lastBotCurrentStatus);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});
