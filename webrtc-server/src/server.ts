import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

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

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
    process.exit(1);
}

const twilioClient = twilio(accountSid, authToken);

app.get('/api/get-turn-credentials', async (req, res) => {
    try {
        const token = await twilioClient.tokens.create();
        res.json({ iceServers: token.iceServers });
    } catch (error) {
        res.status(500).json({ error: "Failed to get TURN credentials." });
    }
});

const rooms: Record<string, string[]> = {};
const usernames: Record<string, string> = {};

io.on('connection', (socket: Socket) => {
  socket.on('join-room', (data: { roomId: string; username: string }) => {
    const { roomId, username } = data;
    
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    
    if (rooms[roomId].length >= 2) {
      socket.emit('room-full');
      return;
    }
    
    usernames[socket.id] = username;
    socket.join(roomId);
    rooms[roomId].push(socket.id);
    
    const otherUsers = rooms[roomId].filter(id => id !== socket.id);
    const otherUsernames: Record<string, string> = {};
    otherUsers.forEach(userId => {
      if (usernames[userId]) {
        otherUsernames[userId] = usernames[userId];
      }
    });
    
    socket.emit('other-users', { users: otherUsers, usernames: otherUsernames });
    socket.to(roomId).emit('user-joined', { socketId: socket.id, username });
  });

  socket.on('offer', (payload) => {
    io.to(payload.target).emit('offer', { signal: payload.signal, caller: payload.caller });
  });

  socket.on('answer', (payload) => {
    io.to(payload.target).emit('answer', { signal: payload.signal, caller: payload.caller });
  });

  socket.on('ice-candidate', (payload) => {
    io.to(payload.target).emit('ice-candidate', { candidate: payload.candidate, from: payload.from });
  });

  socket.on('disconnect', () => {
    let roomIdToRemoveFrom: string | null = null;
    for (const roomId in rooms) {
      const userIndex = rooms[roomId].indexOf(socket.id);
      if (userIndex !== -1) {
        rooms[roomId].splice(userIndex, 1);
        roomIdToRemoveFrom = roomId;
        
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        }
        break;
      }
    }
    
    delete usernames[socket.id];
    
    if (roomIdToRemoveFrom) {
      io.to(roomIdToRemoveFrom).emit('user-left', socket.id);
    }
  });
});

server.listen(PORT, () => {});