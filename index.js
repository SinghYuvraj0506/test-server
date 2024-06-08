
const express = require("express")
const cors = require("cors")
const { Server } = require('socket.io');
const { createServer } = require('node:http');
require("dotenv").config()

const app = express();
const server = createServer(app);
const CLIENT_URL = process.env.CLIENT_URL || 'https://omegle-clone-beta.vercel.app';

// Apply CORS middleware to the Express app
app.use(cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type'],
        credentials: true
    }
});

app.use(express.json())
app.use(express.urlencoded())

app.get("/",(req,res)=>{
    return res.send("Hwllo Guys")
})

let usersMap = []

io.on('connection', (socket) => {
    console.log('a user connected' , socket?.id);
    
    socket.on("userConnect",({username})=>{
        usersMap.push({
            socket: socket.id,
            username: username
        })
        socket.broadcast.emit("new-user-joined",socket?.id)
        console.log("Usercount -----", usersMap?.length)
    })

    socket.on("offerSent",data => {
        const offerReciever = usersMap?.find((e)=>(e.socket === data?.reciever))
        if(offerReciever){
            socket.to(offerReciever?.socket).emit("RecieveOffer",data)
        }
    })

    socket.on("answerCreated",data => {
        const answerReciever = usersMap?.find((e)=>(e.socket === data?.reciever))
        if(answerReciever){
            socket.to(answerReciever?.socket).emit("RecieveAnswer",data?.answer)
        }
    })

    socket.on("sendIceCandidate",data => {
        const reciever = usersMap?.find((e)=>(e.socket === data?.reciever))
        if(reciever){
            socket.to(reciever?.socket).emit("SetPeerIce",data?.iceCandidateData)
        }
    })

    socket.on("disconnect",()=>{
        console.log("User Disconnected!!!!")
        usersMap = usersMap?.filter((e)=>(e.socket !== socket?.id))
    })
  });

server.listen(5000, () => {
    console.log('server running at http://localhost:5000');
  });