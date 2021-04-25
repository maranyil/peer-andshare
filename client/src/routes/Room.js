import React, { useRef, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import io from 'socket.io-client';

const Room = (props) => {
  const userVideo = useRef();
  const partnerVideo = useRef();
  const peerRef = useRef();
  const socketRef = useRef();
  const otherUser = useRef();
  const userStream = useRef();
  const senders = useRef([]);

  const history = useHistory();
  const [stream, setStream] = useState();
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        setStream(stream);
        userVideo.current.srcObject = stream;
        userStream.current = stream;

        socketRef.current = io.connect('/');
        socketRef.current.emit('join room', props.match.params.roomID);

        socketRef.current.on('other user', (userID) => {
          callUser(userID);
          otherUser.current = userID;
        });

        socketRef.current.on('user joined', (userID) => {
          otherUser.current = userID;
        });

        socketRef.current.on('offer', handleRecieveCall);

        socketRef.current.on('answer', handleAnswer);

        socketRef.current.on('ice-candidate', handleNewICECandidateMsg);
      });
  }, []);

  function callUser(userID) {
    peerRef.current = createPeer(userID);
    userStream.current.getTracks()
    .forEach(track => senders.current.push(peerRef.current.addTrack(track, userStream.current)));
}

  function createPeer(userID) {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'stun:stun.stunprotocol.org',
        },
        {
          urls: 'turn:numb.viagenie.ca',
          credential: 'muazkh',
          username: 'webrtc@live.com',
        },
      ],
    });

    peer.onicecandidate = handleICECandidateEvent;
    peer.ontrack = handleTrackEvent;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);
    peerRef.current = peer;
    return peer;
    
  }

  function handleNegotiationNeededEvent(userID) {
    peerRef.current
      .createOffer()
      .then((offer) => {
        return peerRef.current.setLocalDescription(offer);
      })
      .then(() => {
        const payload = {
          target: userID,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription,
        };
        socketRef.current.emit('offer', payload);
      })
      .catch((e) => console.log(e));
  }

  function handleRecieveCall(incoming) {
    peerRef.current = createPeer();
    const desc = new RTCSessionDescription(incoming.sdp);
    peerRef.current
      .setRemoteDescription(desc)
      .then(() => {
        userStream.current
          .getTracks()
          .forEach((track) =>
            peerRef.current.addTrack(track, userStream.current)
          );
      })
      .then(() => {
        return peerRef.current.createAnswer();
      })
      .then((answer) => {
        return peerRef.current.setLocalDescription(answer);
      })
      .then(() => {
        const payload = {
          target: incoming.caller,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription,
        };
        socketRef.current.emit('answer', payload);
      });
  }

  function handleAnswer(message) {
    const desc = new RTCSessionDescription(message.sdp);
    peerRef.current.setRemoteDescription(desc).catch((e) => console.log(e));
  }

  function handleICECandidateEvent(e) {
    if (e.candidate) {
      const payload = {
        target: otherUser.current,
        candidate: e.candidate,
      };
      socketRef.current.emit('ice-candidate', payload);
    }
  }

  function handleNewICECandidateMsg(incoming) {
    const candidate = new RTCIceCandidate(incoming);

    peerRef.current.addIceCandidate(candidate).catch((e) => console.log(e));
  }

  function handleTrackEvent(e) {
    partnerVideo.current.srcObject = e.streams[0];
  }

  //Some settings for buttons control

  // AUDIO CONTROL
  let AudioBtn;
  if (audioMuted) {
    AudioBtn = (
      <button
        onClick={() => {
          toggleMuteAudio();
        }}
        className="audiobtn"
      >
        <img alt="mute/unmute audio" />
      </button>
    );
  } else {
    AudioBtn = (
      <button
        onClick={() => {
          toggleMuteAudio();
        }}
        className="audiobtn"
      >
        <img alt="mute/unmute audio" />
      </button>
    );
  }

  // SHARE
  let ShareBtn;
  ShareBtn = (
    <button className="sharebtn" 
    onClick={() => shareScreen()}>
      <img alt="share screen"/>
    </button>
  );
  // VIDEO
  let VideoBtn;
  if (videoMuted) {
    VideoBtn = (
      <button
        onClick={() => {
          toggleMuteVideo();
        }}
        className="videobtn"
      >
        <img alt="on/off video" />
      </button>
    );
  } else {
    VideoBtn = (
      <button
        onClick={() => {
          toggleMuteVideo();
        }}
        className="videobtn"
      >
        <img alt="on/off video" />
      </button>
    );
  }

  function toggleMuteAudio() {
    if (stream) {
      setAudioMuted(!audioMuted);
      stream.getAudioTracks()[0].enabled = audioMuted;
    }
  }

  function toggleMuteVideo() {
    if (stream) {
      setVideoMuted(!videoMuted);
      stream.getVideoTracks()[0].enabled = videoMuted;
    }
  }

  function shareScreen() {
    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then(stream => {
        const screenTrack = stream.getTracks()[0];
        senders.current.find(sender => sender.track.kind === 'video').replaceTrack(screenTrack);
        screenTrack.onended = function() {
            senders.current.find(sender => sender.track.kind === "video").replaceTrack(userStream.current.getTracks()[1]);
        }
    })
}

  let HangUp;
  HangUp = (
    <button
      className="hangup"
      onClick={() => {
        endCall();
      }}
    >
      <img alt="end call button"></img>
    </button>
  );

  // END CALL
  function endCall() {
    toggleMuteVideo();
    socketRef.current.emit('close', {to: otherUser});
    history.push('/');
    document.location.reload();
  }

  return (
    <div className="Room">
      <div className="MyContainer">
      <video className="MyVid" autoPlay ref={userVideo} />
      </div>
      
      {VideoBtn}
      {AudioBtn}
      {ShareBtn}
      {HangUp}
      <div className="YourContainer">
      <video className="YourVid" autoPlay ref={partnerVideo} />
      </div>
     
    </div>
  );
};

export default Room;
