import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Ruta para servir el cliente
app.get('/', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/index.html');
});

// Escuchar conexiones de socket
io.on('connection', (socket) => {
    console.log('Cliente conectado');

    socket.on('video-stream', (data: string) => {
        // Emitir el fotograma a todos los demás clientes conectados
        socket.broadcast.emit('receive-video-stream', data);
    });

    socket.on('gps-update', (data: string) => {
        if (!isValidJson(data)) {
            console.log('Datos GPS recibidos no válidos:', data);
            return;
        }

        // Emitir los datos GPS a todos los demás clientes conectados
        socket.broadcast.emit('receive-gps-update', data);
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
