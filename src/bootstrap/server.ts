import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import WebSocket from 'ws'
import { BASE_URL, HTTP_SERVER_PORT } from '../constants'

export function initServer(): ServerInstances {
  const app = express()

  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type']
    })
  )

  console.log('Intentando conectar', BASE_URL)
  const gpsSocket = new WebSocket(`${BASE_URL}/current-location`)
  const cameraSocket = new WebSocket(`${BASE_URL}/socket-camera`)

  const server = http.createServer(app)
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })
  // Iniciar el servidor
  server.listen(HTTP_SERVER_PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${HTTP_SERVER_PORT}`)
  })

  return {
    gpsSocket,
    cameraSocket,
    server,
    app,
    io
  }
}

export interface ServerInstances {
  gpsSocket: WebSocket
  cameraSocket: WebSocket
  server: http.Server
  io: Server
  app: express.Application
}
