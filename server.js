// server.js
const express = require('express');
const path = require('path')
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const users = new Map(); // Stores: { code: { name, socketId } }

io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Register user
    socket.on('register', (user) => {
        users.set(user.code, {
            name: user.name,
            socketId: socket.id
        });
        console.log(`User registered: ${user.name} (${user.code})`);
    });

    // Handle heat sending
    socket.on('sendHeat', (data) => {
        const receiver = users.get(data.to);
        if (receiver) {
            io.to(receiver.socketId).emit('receiveHeat', data.name);
            console.log(`${data.from} → ${data.to} : Heat sent`);
        }
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
        users.forEach((value, key) => {
            if (value.socketId === socket.id) {
                users.delete(key);
                console.log(`User disconnected: ${value.name} (${key})`);
            }
        });
    });
});
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});