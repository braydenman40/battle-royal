const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let rooms = {};

io.on('connection', (socket) => {
    
    // HOSTING
    socket.on('createRoom', () => {
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();
        rooms[code] = { players: {}, gameStarted: false };
        
        socket.join(code);
        rooms[code].players[socket.id] = { x: 400, y: 300, color: '#00ff88' };

        socket.emit('roomCreated', code);
        console.log(`Room Created: ${code}`);
    });

    // JOINING
    socket.on('joinRoom', (code) => {
        if (rooms[code]) {
            const currentPlayers = Object.keys(rooms[code].players).length;

            if (currentPlayers >= 10) {
                socket.emit('errorMsg', 'Room is full!');
                return;
            }

            socket.join(code);
            rooms[code].players[socket.id] = {
                x: Math.random() * 700 + 50,
                y: Math.random() * 500 + 50,
                color: '#0088ff'
            };

            socket.emit('joinedSuccess', code);
            
            // Send updated count to everyone in the room
            const newCount = Object.keys(rooms[code].players).length;
            io.to(code).emit('playerUpdate', newCount);

        } else {
            socket.emit('errorMsg', 'Room not found!');
        }
    });

    // START GAME
    socket.on('startGame', (code) => {
        if (rooms[code]) {
            rooms[code].gameStarted = true;
            io.to(code).emit('initGame');
        }
    });

    // CLEANUP ON DISCONNECT
    socket.on('disconnecting', () => {
        for (const room of socket.rooms) {
            if (rooms[room]) {
                delete rooms[room].players[socket.id];
                const newCount = Object.keys(rooms[room].players).length;
                io.to(room).emit('playerUpdate', newCount);
            }
        }
    });
});

http.listen(3000, () => console.log('Server live on port 3000'));
