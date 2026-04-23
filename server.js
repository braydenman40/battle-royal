const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname)); // Serves your index.html

let rooms = {}; // This stores all active game rooms

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // HOSTING A GAME
    socket.on('createRoom', () => {
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();
        rooms[code] = { host: socket.id, players: [socket.id] };
        
        socket.join(code);
        socket.emit('roomCreated', code);
        console.log(`Room ${code} created by ${socket.id}`);
    });

    // JOINING A GAME
    socket.on('joinRoom', (code) => {
        if (rooms[code]) {
            rooms[code].players.push(socket.id);
            socket.join(code);
            
            // Tell the person joining they are in
            socket.emit('joinedSuccess', code);
            
            // Tell the host a new player joined
            io.to(code).emit('playerJoined', rooms[code].players.length);
            console.log(`User ${socket.id} joined room ${code}`);
        } else {
            socket.emit('errorMsg', 'Room not found! Check the code.');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = 3000;
http.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));