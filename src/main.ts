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
        socket.broadcast.emit('video-stream', data);
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
