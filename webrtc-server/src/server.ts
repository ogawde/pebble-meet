import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';



const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;





const rooms: Record<string, string[]> = {};

io.on('connection', (socket: Socket) => {

    console.log(` User connected: ${socket.id}`);

    socket.on('join-room', (roomId: string) => {
        console.log(` User ${socket.id} joining room: ${roomId}`);
        socket.join(roomId);
        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }
        rooms[roomId].push(socket.id);
        const otherUsers = rooms[roomId].filter(id => id !== socket.id);
        console.log(` ${roomId} `, rooms[roomId]);
        console.log(`Sending other-users to ${socket.id}:`, otherUsers);
        socket.emit('other-users', otherUsers);
        socket.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('offer', (payload) => {
        console.log(` offer from ${payload.caller} to ${payload.target}`);
        io.to(payload.target).emit('offer', { signal: payload.signal, caller: payload.caller });
    });

    socket.on('answer', (payload) => {
        console.log(` Answer from ${payload.caller} to ${payload.target}`);
        io.to(payload.target).emit('answer', { signal: payload.signal, caller: payload.caller });
    });

    socket.on('ice-candidate', (payload) => {
        console.log(`ICE candidate from ${payload.from} to ${payload.target}`);
        io.to(payload.target).emit('ice-candidate', { candidate: payload.candidate, from: payload.from });
    });

    socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.id}`);
        let roomIdToRemoveFrom: string | null = null;
        for (const roomId in rooms) {
            const userIndex = rooms[roomId].indexOf(socket.id);
            if (userIndex !== -1) {
                rooms[roomId].splice(userIndex, 1);
                roomIdToRemoveFrom = roomId;
                console.log(` Removed ${socket.id} from room ${roomId}`);
                break;
            }
        }
        if (roomIdToRemoveFrom) {
            io.to(roomIdToRemoveFrom).emit('user-left', socket.id);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Signaling server is running on http://localhost:${PORT}`);
});