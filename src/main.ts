import express, { Request, Response } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { MoveCommand, moveRobot } from "./backend-client";
import WebSocket from "ws";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

const gpsSocket = new WebSocket("http://10.68.17.134:8000/current-location");
const cameraSocket = new WebSocket("http://10.68.17.134:8000/kamavinga")

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let lastBotVideoFrame: string = "";
let lastBotGpsCoors: Coords = { latitude: 0, longitude: 0 };
const clientsPool: Socket[] = [];

// Ruta para servir el cliente
app.get("/", (req: Request, res: Response) => {
  res.sendFile(__dirname + "/index.html");
});

gpsSocket.onmessage = (event) => {
  const data = JSON.parse(event.data.toString());
  const coords: Coords = {
    longitude: data.coordinates[0],
    latitude: data.coordinates[1],
  };

  clientsPool.forEach((socket) => {
    socket.emit("receive-gps-update", coords);
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

  socket.on("video-stream", (videoFrame: string) => {
    console.log("Fotograma de video recibido");
    lastBotVideoFrame = videoFrame;
    // Emitir el fotograma a todos los demás clientes conectados
    socket.broadcast.emit("receive-video-stream", videoFrame);
  });

  socket.on("move", (command: MoveCommand) => {
    console.log(`Dirección recibida: ${JSON.stringify(command)}`);
    // Aquí puedes agregar la lógica para manejar el movimiento del bot

    moveRobot(command);
  });

  socket.on("speed", (speed: number) => {
    console.log(`Velocidad recibida: ${speed}`);
    // Aquí puedes agregar la lógica para la velocidad del bot
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

// Iniciar el servidor
const PORT = 4050;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
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
