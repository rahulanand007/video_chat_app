var socket = io(); //// Use io.connect('URL') to connect to specific URL

let videoChatForm = document.getElementById("video-chat-form");
let videoChatRooms = document.getElementById("video-chat-rooms");
let joinBtn = document.getElementById("join");
let roomInput = document.getElementById("roomName");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");

let divBtnGroup = document.getElementById("btn-group");
let muteButton = document.getElementById("muteButton");
let hideCamera = document.getElementById("hideCamera");
let leaveRoomButton = document.getElementById("leaveRoomButton");

let muteFlag = false;
let hideCameraFlag = false;

//To get audio and media from thebrowser
navigator.getMediaUser =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;
let roomName = roomInput.value;

let creator = false;

let rtcPeerConnection;
let userStream;

let iceServers = {
  iceServers: [
    {
      urls: "stun:stun.services.mozilla.com",
    },
    {
      urls: "stun:stun1.l.google.com:19302",
    },
  ],
};

//JOIN
joinBtn.addEventListener("click", () => {
  if (roomInput.value == "") {
    alert("Please enter a room name");
  } else {
    //Emit Socket event
    roomName = roomInput.value;
    socket.emit("join", roomInput.value);
  }
});

//MUTE
muteButton.addEventListener("click", () => {
  muteFlag = !muteFlag;
  if (muteFlag) {
    userStream.getTracks()[0].enabled = false;
    muteButton.textContent = "Unmute";
  } else {
    userStream.getTracks()[0].enabled = true;
    muteButton.textContent = "Mute";
  }
});

//Hide/Unhide Camera
hideCamera.addEventListener("click", () => {
  hideCameraFlag = !hideCameraFlag;
  if (hideCameraFlag) {
    userStream.getTracks()[1].enabled = false;
    hideCamera.textContent = "Unhide Camera";
  } else {
    userStream.getTracks()[1].enabled = true;
    hideCamera.textContent = "Hide Camera";
  }
});

//LEAVE
leaveRoomButton.addEventListener("click", () => {
  socket.emit("leave", roomName);

  videoChatForm.style = "display:block";
  divBtnGroup.style = "display:none";

  if (userVideo.srcObject) {
    //User
    userVideo.srcObject.getTracks()[0].stop(); //stop audio
    userVideo.srcObject.getTracks()[1].stop(); //stop video
  }else if(peerVideo.srcObject){
    //Peer
    peerVideo.srcObject.getTracks()[0].stop(); //stop audio
    peerVideo.srcObject.getTracks()[1].stop(); //stop video
  }

  if(rtcPeerConnection){
    rtcPeerConnection.ontrack = null
    rtcPeerConnection.onicecandidate= null
    rtcPeerConnection.close()
  }
});

socket.on("leave", () => {
    creator = true
    if(peerVideo.srcObject){
        //Peer
        peerVideo.srcObject.getTracks()[0].stop(); //stop audio
        peerVideo.srcObject.getTracks()[1].stop(); //stop video
      }
    
      if(rtcPeerConnection){
        rtcPeerConnection.ontrack = null
        rtcPeerConnection.onicecandidate= null
        rtcPeerConnection.close()
      }
});

socket.on("created", () => {
  creator = true;
  navigator.getUserMedia(
    {
      audio: true,
      video: { width: 400, height: 400 },
    },
    function (stream) {
      userStream = stream;
      userVideo.srcObject = stream;
      videoChatForm.style = "display:none";
      divBtnGroup.style = "display:flex";
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
    },
    function (error) {
      alert("error while getting audio video");
      console.log(error);
    }
  );
});

socket.on("joined", () => {
  creator = false;
  navigator.getUserMedia(
    {
      audio: true,
      video: { width: 400, height: 400 },
    },
    function (stream) {
      userStream = stream;
      userVideo.srcObject = stream;
      videoChatForm.style = "display:none";
      divBtnGroup.style = "display:flex";

      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
      console.log(roomName, "-1-1-1-1");
      socket.emit("ready", roomName);
    },
    function (error) {
      alert("error while getting audio video");
      console.log(error);
    }
  );
});

socket.on("full",()=>{
    alert("Room is full")
})

socket.on("ready", () => {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers); // Create new connection and create public IP
    rtcPeerConnection.onicecandidate = onIceCandidateFunction; // To exchange candidate
    rtcPeerConnection.ontrack = onTrackFunction; //To load second user media
    //Audio
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); //send user1 video/Audio to second user(Peer)  //['audio','video']
    //Video
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);

    //Create Offer
    rtcPeerConnection.createOffer(
      function (offer) {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomName);
      },
      function (error) {
        console.log(error);
      }
    );
  }
});

socket.on("candidate", (candidate) => {
  let iceCandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(candidate);
});

socket.on("offer", (offer) => {
  //This code will be for those who joined
  if (!creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers); // Create new connection and create public IP
    rtcPeerConnection.onicecandidate = onIceCandidateFunction; // To exchange candidate
    rtcPeerConnection.ontrack = onTrackFunction; //To load second user media
    //Audio
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream); //send user1 video/Audio to second user(Peer)  //['audio','video']
    //Video
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);

    rtcPeerConnection.setRemoteDescription(offer);

    //Create Answer
    rtcPeerConnection.createAnswer(
      function (answer) {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, roomName);
      },
      function (error) {
        console.log(error);
      }
    );
  }
});

socket.on("answer", (answer) => {
  rtcPeerConnection.setRemoteDescription(answer);
});

const onIceCandidateFunction = (event) => {
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName);
  }
};

//To stream Second User audio/video
const onTrackFunction = (event) => {
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = function (e) {
    peerVideo.play();
  };
};
