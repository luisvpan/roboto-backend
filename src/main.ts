import { Request, Response } from "express";
import { Socket } from "socket.io";
import { MoveCommand, moveRobot } from "./backend-client";
import { initServer } from './bootstrap/server';

const { gpsSocket, cameraSocket, app, io } = initServer();

let lastBotVideoFrame: string = "";
let lastBotLocationData: LocationData = {
  coors: {
    latitude: 0,
    longitude: 0
  },
  orientation: 0,
  speed: 0
}
const clientsPool: Socket[] = [];

// Ruta para servir el cliente
app.get("/", (req: Request, res: Response) => {
  res.sendFile(__dirname + "/index.html");
});

gpsSocket.onmessage = (event) => {
  const data: RawLocationData = JSON.parse(event.data.toString());
  const coords: Coords = {
    longitude: data.coordinates.coordinates[0],
    latitude: data.coordinates.coordinates[1],
  };

  lastBotLocationData = {
    coors: coords,
    orientation: data.orientation,
    speed: data.speed
  }
  console.log("GPS Data", lastBotLocationData);

  clientsPool.forEach((socket) => {
    socket.emit("receive-gps-update", coords);
    socket.emit("receive-gps-speed", data.speed);
    socket.emit("receive-gps-orientation", data.orientation);
  });

};

cameraSocket.onmessage = (event) => {
  const base64Image = event.data.toString();

  clientsPool.forEach((socket) => {
    socket.emit("receive-video-stream", base64Image);
  });
}

// Escuchar conexiones de socket
io.on("connection", (socket) => {
  clientsPool.push(socket);

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

// Helpers
function isValidJson(data: string): boolean {
  try {
    JSON.parse(data);
    return true;
  } catch (e) {
    return false;
  }
}

interface Coords {
  latitude: number;
  longitude: number;
}

interface LocationData {
  coors: Coords;
  orientation: number;
  speed: number;
}

interface RawLocationData {
  coordinates: {
    coordinates: [number, number];
  },
  orientation: number;
  speed: number;
}