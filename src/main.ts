import { Request, Response } from 'express'
import { Socket } from 'socket.io'
import {
  changeMode,
  changeSpeed,
  changeTarget,
  getCurrentStatus,
  MoveCommand,
  moveRobot
} from './backend-client'
import { initServer } from './bootstrap/server'
import {
  LocationData,
  RawLocationData,
  Coords,
  CurrentStatus,
  MovementMode
} from './types'
import { isValidJson } from './helpers'

const { gpsSocket, cameraSocket, io } = initServer()

console.log('Server is running')

let lastBotVideoFrame: string = ''
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
  movementSpeed: 0, // Esta (si se llegara a implementar) es la velocidad "teorica" establecida para el bot
  // Map Mode
  targetCoords: { latitude: 0, longitude: 0 },
  targetOrientation: 0,
}
const clientsPool: Socket[] = []
//const coorsQueues: Coords[] = []; <--- for the path mode

// Waypoints Mode
const waypointsCoors: Coords[] = [];


gpsSocket.onmessage = (event) => {
  const txtJson = event.data.toString()
  if (!isValidJson(txtJson)) {
    console.error('Invalid JSON data on GPS socket')
    return
  }

  const data: RawLocationData = JSON.parse(txtJson)
  const coords: Coords = {
    longitude: data.coordinates.coordinates[0],
    latitude: data.coordinates.coordinates[1]
  }

  lastBotLocationData = {
    coors: coords,
    orientation: data.orientation,
    speed: data.speed
  }
  console.log('orientation', data.orientation)
  //console.log("GPS Data", lastBotLocationData);

  clientsPool.forEach((socket) => {
    socket.emit('receive-gps-update', coords)
    socket.emit('receive-gps-speed', data.speed)
    socket.emit('receive-gps-orientation', data.orientation)
  })
}

cameraSocket.onmessage = (event) => {
  const base64Image = event.data.toString()

  clientsPool.forEach((socket) => {
    lastBotVideoFrame = base64Image
    socket.emit('receive-video-stream', base64Image)
  })
}

// Escuchar conexiones de socket
io.on('connection', async (socket) => {
  clientsPool.push(socket)
  lastBotCurrentStatus = await getCurrentStatus()
  socket.emit('receive-current-status', lastBotCurrentStatus)

  socket.on('move', async (command: MoveCommand) => {
    console.log(`Dirección recibida: ${JSON.stringify(command)}`)
    lastBotCurrentStatus = await moveRobot(command)
    socket.emit('receive-current-status', lastBotCurrentStatus)
  })

  // Esto cambia la velocidad teorica si llegase a implementarse en el frontend y el python
  socket.on('speed', async (speed: number) => {
    console.log(`Velocidad recibida: ${speed}`)
    lastBotCurrentStatus = await changeSpeed(speed)
    socket.emit('receive-current-status', lastBotCurrentStatus)
  })

  // Cambiar el modo
  socket.on('change-mode', async (mode: MovementMode) => {
    console.log(`Modo recibido: ${mode}`)
    lastBotCurrentStatus = await changeMode(mode)
    socket.emit('receive-current-status', lastBotCurrentStatus)
  })

  // Cambiar el target
  socket.on('change-target', async (_targetCoords: { position: { lat: number, lng: number } }) => {
    console.log(`Target recibido: ${JSON.stringify(_targetCoords)}`)
    const targetCoords = {
      latitude: _targetCoords.position.lat,
      longitude: _targetCoords.position.lng
    }

    if (lastBotCurrentStatus.movementMode === MovementMode.MAP) {
      console.log(`Target recibido: ${JSON.stringify(targetCoords)}`)
      lastBotCurrentStatus = await changeTarget(targetCoords)
      socket.emit('receive-current-status', lastBotCurrentStatus)
    } else if (lastBotCurrentStatus.movementMode === MovementMode.PATH) {
      console.log(`Target recibido: ${JSON.stringify(targetCoords)}`)
      lastBotCurrentStatus = await changeTarget(targetCoords)
      waypointsCoors.push(targetCoords)
      socket.emit('receive-current-status', lastBotCurrentStatus)
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado')
  })
})
