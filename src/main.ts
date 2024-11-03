import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';


const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

let lastBotVideoFrame: string = '';
let lastBotGpsCoors: Coors = { latitude: 0, longitude: 0 };

// Ruta para servir el cliente
app.get('/', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/index.html');
});

// Escuchar conexiones de socket
io.on('connection', (socket) => {
    console.log('Cliente conectado');

    socket.on('video-stream', (videoFrame: string) => {
        console.log('Fotograma de video recibido');
        lastBotVideoFrame = videoFrame;
        // Emitir el fotograma a todos los demás clientes conectados
        socket.broadcast.emit('receive-video-stream', videoFrame);
    });

    socket.on('gps-update', (rawCoors: string | Coors) => {
        console.log('Datos GPS recibidos');
        let botCoors: Coors = { latitude: 0, longitude: 0 };

        if (typeof rawCoors === 'string') {
            if (!isValidJson(rawCoors)) {
                console.log('Datos GPS recibidos no válidos:', rawCoors);
                return;
            }

            botCoors = JSON.parse(rawCoors);
        } else {
            botCoors = rawCoors;
        }

        lastBotGpsCoors = botCoors;
        // Emitir los datos GPS a todos los demás clientes conectados
        socket.broadcast.emit('receive-gps-update', botCoors);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
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

interface Coors {
    latitude: number;
    longitude: number;
}