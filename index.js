const express = require("express");
const cors = require("cors");
const { Server } = require('socket.io');
const { createServer } = require('http');
const path = require('path');
require("dotenv").config();

const app = express();
const server = createServer(app);
const CLIENT_URL = ['https://omegle-clone-beta.vercel.app'];

// Apply CORS middleware to the Express app
app.use(cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
}));

const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve the Vite build for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

let usersMap = [];

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);

    socket.on("userConnect", ({ username }) => {
        usersMap.push({
            socket: socket.id,
            username: username
        });
        socket.broadcast.emit("new-user-joined", socket.id);
        console.log("Usercount -----", usersMap.length);
    });

    socket.on("offerSent", data => {
        const offerReceiver = usersMap.find(e => e.socket === data.reciever);
        if (offerReceiver) {
            socket.to(offerReceiver.socket).emit("RecieveOffer", data);
        }
    });

    socket.on("answerCreated", data => {
        const answerReceiver = usersMap.find(e => e.socket === data.reciever);
        if (answerReceiver) {
            socket.to(answerReceiver.socket).emit("RecieveAnswer", data.answer);
        }
    });

    socket.on("sendIceCandidate", data => {
        const receiver = usersMap.find(e => e.socket === data.reciever);
        if (receiver) {
            socket.to(receiver.socket).emit("SetPeerIce", data.iceCandidateData);
        }
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected!!!!");
        usersMap = usersMap.filter(e => e.socket !== socket.id);
    });
});

server.listen(5000, () => {
    console.log('server running at http://localhost:5000');
});
