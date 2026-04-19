require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const Room = require('./models/Room');
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

connectDB();

app.use(cors());
app.use(express.json({ extended: false }));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

if (process.env.REDIS_URL) {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const { createClient } = require('redis');
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
        io.adapter(createAdapter(pubClient, subClient));
        console.log('Redis adapter connected for horizontal scaling');
    }).catch(err => console.log('Redis connection failed, running natively:', err.message));
}

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
        socket.username = decoded.user.username;
        // Mark explicitly online
        await User.findOneAndUpdate({ username: socket.username }, { isOnline: true });
        io.emit('userStatusChanged', { username: socket.username, isOnline: true });
        next();
    });
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.username}`);

    socket.on('joinRoom', async ({ roomId }) => {
        socket.join(roomId);
        try {
            const messages = await Message.find({ roomId }).sort({ timestamp: 1 });
            // Mark all messages as read that aren't ours
            messages.forEach(async (m) => {
                if (m.sender !== socket.username && m.status !== 'read') {
                    await Message.findByIdAndUpdate(m._id, { status: 'read' });
                    io.to(roomId).emit('messageRead', { messageId: m._id });
                }
            });
            socket.emit('history', messages);
        } catch (error) {
            console.error('History error', error);
        }
    });

    socket.on('leaveRoom', ({ roomId }) => {
        socket.leave(roomId);
    });

    socket.on('typing', ({ roomId, isTyping }) => {
        socket.to(roomId).emit('typing', { username: socket.username, isTyping });
    });

    socket.on('unsendMessage', async ({ messageId, roomId }) => {
        try {
            const msg = await Message.findOneAndDelete({ _id: messageId, sender: socket.username });
            if (msg) {
                io.to(roomId).emit('messageDeleted', { messageId });
            }
        } catch (err) {
            console.error('Error unsending message:', err);
        }
    });

    socket.on('groupRenamed', ({ roomId, newName }) => {
        // Broadcast the real-time rename cleanly
        socket.to(roomId).emit('groupRenamed', { roomId, newName });
    });

    socket.on('chatMessage', async ({ roomId, content, messageType }) => {
        try {
            const newMsg = new Message({
                roomId,
                sender: socket.username,
                content,
                messageType: messageType || 'text',
                status: 'delivered' 
            });
            await newMsg.save();
            await Room.findByIdAndUpdate(roomId, { lastMessage: newMsg._id });

            io.to(roomId).emit('message', newMsg);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.username}`);
        await User.findOneAndUpdate({ username: socket.username }, { isOnline: false, lastSeen: Date.now() });
        io.emit('userStatusChanged', { username: socket.username, isOnline: false, lastSeen: Date.now() });
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
