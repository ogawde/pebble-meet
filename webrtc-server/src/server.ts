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
    console.error("Twilio credentials are not set in the environment variables.");
    process.exit(1);
}

const twilioClient = twilio(accountSid, authToken);

app.get('/api/get-turn-credentials', async (req, res) => {
    try {
        console.log("Request received for TURN credentials.");
        const token = await twilioClient.tokens.create();
        console.log("Successfully fetched TURN credentials from Twilio.");
        res.json({ iceServers: token.iceServers });
    } catch (error) {
        console.error("Failed to get TURN credentials from Twilio", error);
        res.status(500).json({ error: "Failed to get TURN credentials." });
    }
});


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
    console.log(` Room ${roomId} users:`, rooms[roomId]);
    console.log(` Sending other-users to ${socket.id}:`, otherUsers);
    socket.emit('other-users', otherUsers);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('offer', (payload) => {
    console.log(` Offer from ${payload.caller} to ${payload.target}`);
    io.to(payload.target).emit('offer', { signal: payload.signal, caller: payload.caller });
  });

  socket.on('answer', (payload) => {
    console.log(`Answer from ${payload.caller} to ${payload.target}`);
    io.to(payload.target).emit('answer', { signal: payload.signal, caller: payload.caller });
  });

  socket.on('ice-candidate', (payload) => {
    console.log(` ICE candidate from ${payload.from} to ${payload.target}`);
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
});