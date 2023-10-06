const socket = require("socket.io");

const socket_connection = async (server) => {
  const io = socket(server);

  //Check Socket Connection
  io.on("connection", (socket) => {
    console.log("socket connected with id :" + socket.id);

    //Catch event (room join connection)
    socket.on("join", (roomName) => {
      const rooms = io.sockets.adapter.rooms; //Get rooms data
      const room  =rooms.get(roomName) //existing room
      if(!room || room==undefined){
        socket.join(roomName)  // Create room
        console.log("created")
        socket.emit("created")
      }else if(room.size==1){
        socket.join(roomName)  // Join Room if already existing
        console.log("Room Joined with size :" , room.size)
        socket.emit("joined")
        console.log("joined")
      }else{
        console.log("Room full")
        socket.emit("full")
      }
      
      console.log(rooms,"---")

    });

    //Emit Ready event Whenever a new user joins to display that a user has joined
    socket.on("ready",(roomName)=>{
        console.log("Ready")
        socket.broadcast.to(roomName).emit("ready") //Broadcast to specific room -can remove .to() if want to broadcast everywhere
    })

    socket.on("candidate",(candidate,roomName)=>{
        console.log("Candidate")
        socket.broadcast.to(roomName).emit("candidate",candidate) 
    })

    //All the encrypted info will be in offer
    socket.on("offer",(offer,roomName)=>{
        console.log("Offer")
        socket.broadcast.to(roomName).emit("offer",offer) 
    })

    //Answer - accept or reject call
    socket.on("answer",(answer,roomName)=>{
        console.log("Answer")
        socket.broadcast.to(roomName).emit("answer",answer) 
    })

    //Leave room
    socket.on('leave',(roomName)=>{
        socket.leave(roomName);
        socket.broadcast.to(roomName).emit("leave")
    })

  });
};

module.exports = {
  socket_connection,
};
