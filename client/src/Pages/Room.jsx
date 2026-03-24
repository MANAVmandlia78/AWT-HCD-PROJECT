import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../Providers/Socket";
import Whiteboard from "./Whiteboard";

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

const Room = () => {
  const socket = useSocket();
  const { roomId } = useParams();
  const myEmail = useMemo(() => localStorage.getItem("webrtc-email") || "", []);

  const [participants, setParticipants] = useState([]);
  const [currentSharer, setCurrentSharer] = useState(null); // {socketId, emailId}
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [notice, setNotice] = useState("");

  const peersRef = useRef(new Map()); // remoteSocketId -> RTCPeerConnection
  const participantsRef = useRef([]);
  const remoteStreamRef = useRef(null);
  const myStreamRef = useRef(null);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    myStreamRef.current = myStream;
  }, [myStream]);

  const closePeerConnection = useCallback((remoteSocketId) => {
    const pc = peersRef.current.get(remoteSocketId);
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.close();
      peersRef.current.delete(remoteSocketId);
    }
  }, []);

  const closeAllPeerConnections = useCallback(() => {
    for (const remoteSocketId of peersRef.current.keys()) {
      closePeerConnection(remoteSocketId);
    }
  }, [closePeerConnection]);

  const createPeerConnection = useCallback(
    (remoteSocketId) => {
      if (peersRef.current.has(remoteSocketId)) {
        return peersRef.current.get(remoteSocketId);
      }

      const pc = new RTCPeerConnection(rtcConfig);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc-ice-candidate", {
            to: remoteSocketId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
  const stream = event.streams[0];
  if (stream) {
    setRemoteStream(stream);
    remoteStreamRef.current = stream;
  }
};

      peersRef.current.set(remoteSocketId, pc);
      return pc;
    },
    [socket]
  );

  const addOrReplaceTracks = useCallback((pc, stream) => {
    const senders = pc.getSenders();
    stream.getTracks().forEach((track) => {
      const existing = senders.find((s) => s.track && s.track.kind === track.kind);
      if (existing) {
        existing.replaceTrack(track);
      } else {
        pc.addTrack(track, stream);
      }
    });
  }, []);

  const createOfferForViewer = useCallback(
    async (viewerSocketId) => {
      const stream = myStreamRef.current;
      if (!stream) return;
      const pc = createPeerConnection(viewerSocketId);
      addOrReplaceTracks(pc, stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", { to: viewerSocketId, offer });
    },
    [addOrReplaceTracks, createPeerConnection, socket]
  );

  const stopScreenShare = useCallback(() => {
    if (myStreamRef.current) {
      myStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    myStreamRef.current = null;
    setMyStream(null);
    setIsSharing(false);
    socket.emit("stop-screen-share");
    closeAllPeerConnections();
  }, [closeAllPeerConnections, socket]);

  const isAnotherUserPresenting = Boolean(currentSharer && currentSharer.socketId !== socket?.id);
  const singleScreenStream = isSharing ? myStream : remoteStream;

  const startScreenShare = useCallback(async () => {
    if (!socket?.id) return;
    if (currentSharer && currentSharer.socketId !== socket.id) {
      setNotice(`${currentSharer.emailId || "Another user"} is already sharing.`);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      stream.getTracks().forEach((track) => {
        track.onended = () => stopScreenShare();
      });

      setNotice("");
      setMyStream(stream);
      setIsSharing(true);
      socket.emit("request-screen-share");
    } catch (error) {
      console.error("Error starting screen share:", error);
    }
  }, [currentSharer, socket, stopScreenShare]);

  useEffect(() => {
    if (!socket || !roomId) return;
    if (myEmail) {
      socket.emit("join-room", { roomId, emailId: myEmail });
    }
    socket.emit("get-room-state");
  }, [myEmail, roomId, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleJoinedRoom = ({ participants: initialParticipants = [], currentSharer: sharer = null }) => {
      setParticipants(initialParticipants);
      setCurrentSharer(sharer);
    };

    const handleRoomState = ({ participants: stateParticipants = [], currentSharer: sharer = null }) => {
      setParticipants(stateParticipants);
      setCurrentSharer(sharer);
    };

    const handleParticipantsUpdate = ({ participants: nextParticipants = [] }) => {
      setParticipants(nextParticipants);
    };

    const handleParticipantJoined = async ({ socketId }) => {
      if (isSharing && socket.id && socket.id === currentSharer?.socketId) {
        await createOfferForViewer(socketId);
      }
    };

    const handleParticipantLeft = ({ socketId }) => {
      closePeerConnection(socketId);
      if (currentSharer?.socketId === socketId) {
        remoteStreamRef.current = null;
        setRemoteStream(null);
        setCurrentSharer(null);
      }
    };

    const handleScreenShareStarted = async ({ sharerSocketId, sharerEmail }) => {
      setCurrentSharer({ socketId: sharerSocketId, emailId: sharerEmail });
      setNotice("");

      if (socket.id === sharerSocketId) {
        const viewers = participantsRef.current.filter((p) => p.socketId !== socket.id);
        for (const viewer of viewers) {
          await createOfferForViewer(viewer.socketId);
        }
      } else {
        remoteStreamRef.current = null;
        setRemoteStream(null);
      }
    };

    const handleScreenShareDenied = ({ sharerEmail }) => {
      setNotice(`${sharerEmail || "Another user"} is already sharing.`);
      if (myStreamRef.current) {
        myStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      myStreamRef.current = null;
      setMyStream(null);
      setIsSharing(false);
    };

    const handleScreenShareStopped = () => {
      setCurrentSharer(null);
      setIsSharing(false);
      remoteStreamRef.current = null;
      setRemoteStream(null);
      closeAllPeerConnections();
    };

    const handleWebRtcOffer = async ({ from, offer }) => {
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { to: from, answer });
    };

    const handleWebRtcAnswer = async ({ from, answer }) => {
      const pc = peersRef.current.get(from);
      if (!pc) return;
      await pc.setRemoteDescription(answer);
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      const pc = peersRef.current.get(from) || createPeerConnection(from);
      if (!candidate) return;
      try {
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.error("Failed to add ICE candidate:", error);
      }
    };

    socket.on("joined-room", handleJoinedRoom);
    socket.on("room-state", handleRoomState);
    socket.on("participants-update", handleParticipantsUpdate);
    socket.on("participant-joined", handleParticipantJoined);
    socket.on("participant-left", handleParticipantLeft);
    socket.on("screen-share-started", handleScreenShareStarted);
    socket.on("screen-share-denied", handleScreenShareDenied);
    socket.on("screen-share-stopped", handleScreenShareStopped);
    socket.on("webrtc-offer", handleWebRtcOffer);
    socket.on("webrtc-answer", handleWebRtcAnswer);
    socket.on("webrtc-ice-candidate", handleIceCandidate);

    return () => {
      socket.off("joined-room", handleJoinedRoom);
      socket.off("room-state", handleRoomState);
      socket.off("participants-update", handleParticipantsUpdate);
      socket.off("participant-joined", handleParticipantJoined);
      socket.off("participant-left", handleParticipantLeft);
      socket.off("screen-share-started", handleScreenShareStarted);
      socket.off("screen-share-denied", handleScreenShareDenied);
      socket.off("screen-share-stopped", handleScreenShareStopped);
      socket.off("webrtc-offer", handleWebRtcOffer);
      socket.off("webrtc-answer", handleWebRtcAnswer);
      socket.off("webrtc-ice-candidate", handleIceCandidate);
    };
  }, [
    closeAllPeerConnections,
    closePeerConnection,
    createOfferForViewer,
    createPeerConnection,
    currentSharer,
    isSharing,
    socket,
  ]);

  useEffect(() => {
    return () => {
      closeAllPeerConnections();
      if (myStreamRef.current) {
        myStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [closeAllPeerConnections]);

  return (
    <div className="room-root">
      <header className="room-header">
        <div className="room-header-left">
          <div className="room-logo">
          <img 
  src="/black_white_on_trans.png"
  alt="error" 
  width="90" 
  height="85" 
/>
            <span className="room-logo-text">ClassConnect</span>
          </div>
          <span className="room-header-people" title="People in this room">
            {participants.length}{" "}
            {participants.length === 1 ? "person" : "people"}
          </span>
        </div>
        <div className="room-status">
          {currentSharer ? (
            <span className="status-badge connected">
              <span className="status-dot" />
              Sharing: {currentSharer.emailId}
            </span>
          ) : (
            <span className="status-badge waiting">
              <span className="status-dot waiting-dot" />
              No one is sharing
            </span>
          )}
        </div>
        {!isAnotherUserPresenting ? (
          <button
            className={`share-btn ${isSharing ? "sharing" : ""}`}
            onClick={isSharing ? stopScreenShare : startScreenShare}
          >
            {isSharing ? "Stop Sharing" : "Share Screen"}
          </button>
        ) : (
          <span className="status-badge waiting">
            Viewing {currentSharer?.emailId}
          </span>
        )}
      </header>

      {notice ? <p className="room-notice">{notice}</p> : null}

      <main className="room-main room-main-split">
        <div className="room-screen-col">
          <div className={`video-card ${!singleScreenStream ? "empty" : ""}`}>
            <div className="video-label">
              {currentSharer
                ? `${currentSharer.emailId}'s Screen`
                : "Live Screen"}
            </div>
            {singleScreenStream ? (
              
              <video
                ref={(video) => {
                  if (video) video.srcObject = singleScreenStream;
                }}
                autoPlay
                muted
                playsInline
                className="video-el"
              />
            ) : (
              <div className="video-placeholder">
                <p>No active screen share yet.</p>
              </div>
            )}
          </div>
        </div>
        <div className="room-whiteboard-col">
          <div className="room-whiteboard-inner">
            <Whiteboard />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Room;
