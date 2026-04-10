import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../Providers/Socket";
import Whiteboard from "./Whiteboard";
import "../Styles/room.css";

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

const Room = () => {
  const socket = useSocket();
  const { roomId } = useParams();

  const [participants, setParticipants] = useState([]);
  const [currentSharer, setCurrentSharer] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [notice, setNotice] = useState("");

  const peersRef = useRef(new Map());
  const participantsRef = useRef([]);
  const remoteStreamRef = useRef(null);
  const myStreamRef = useRef(null);

  useEffect(() => { participantsRef.current = participants; }, [participants]);
  useEffect(() => { myStreamRef.current = myStream; }, [myStream]);

  const closePeerConnection = useCallback((id) => {
    const pc = peersRef.current.get(id);
    if (pc) { pc.close(); peersRef.current.delete(id); }
  }, []);

  const closeAllPeerConnections = useCallback(() => {
    peersRef.current.forEach((_, id) => closePeerConnection(id));
  }, [closePeerConnection]);

  const createPeerConnection = useCallback((id) => {
    if (peersRef.current.has(id)) return peersRef.current.get(id);

    const pc = new RTCPeerConnection(rtcConfig);

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit("webrtc-ice-candidate", { to: id, candidate: e.candidate });
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (stream) { setRemoteStream(stream); remoteStreamRef.current = stream; }
    };

    peersRef.current.set(id, pc);
    return pc;
  }, [socket]);

  const addTracks = useCallback((pc, stream) => {
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
  }, []);

  const createOffer = useCallback(async (id) => {
    const stream = myStreamRef.current;
    if (!stream) return;

    const pc = createPeerConnection(id);
    addTracks(pc, stream);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("webrtc-offer", { to: id, offer });
  }, [addTracks, createPeerConnection, socket]);

  const startScreenShare = async () => {
    if (!socket?.id) return;

    if (currentSharer && currentSharer.socketId !== socket.id) {
      setNotice("Another user is already sharing");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => { t.onended = stopScreenShare; });
      setMyStream(stream);
      setIsSharing(true);
      socket.emit("request-screen-share");
    } catch (err) {
      console.error(err);
    }
  };

  const stopScreenShare = () => {
    myStreamRef.current?.getTracks().forEach((t) => t.stop());
    setMyStream(null);
    setIsSharing(false);
    socket.emit("stop-screen-share");
    closeAllPeerConnections();
  };

  useEffect(() => {
    if (!socket || !roomId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    socket.emit("join-room", { roomId, token });
    socket.on("joined-room", () => socket.emit("get-room-state"));
    return () => { socket.off("joined-room"); };
  }, [roomId, socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on("room-state", ({ participants, currentSharer }) => {
      setParticipants(participants);
      setCurrentSharer(currentSharer);
    });

    socket.on("participants-update", ({ participants }) => setParticipants(participants));

    socket.on("participant-joined", async ({ socketId }) => {
      if (isSharing) await createOffer(socketId);
    });

    socket.on("participant-left", ({ socketId }) => closePeerConnection(socketId));

    socket.on("screen-share-started", ({ sharerSocketId, userId }) => {
      setCurrentSharer({ socketId: sharerSocketId, userId });
      if (socket.id === sharerSocketId) {
        participantsRef.current.forEach((p) => {
          if (p.socketId !== socket.id) createOffer(p.socketId);
        });
      }
    });

    socket.on("screen-share-stopped", () => {
      setCurrentSharer(null);
      setRemoteStream(null);
      closeAllPeerConnections();
    });

    socket.on("webrtc-offer", async ({ from, offer }) => {
      const pc = createPeerConnection(from);
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { to: from, answer });
    });

    socket.on("webrtc-answer", async ({ from, answer }) => {
      const pc = peersRef.current.get(from);
      if (pc) await pc.setRemoteDescription(answer);
    });

    socket.on("webrtc-ice-candidate", async ({ from, candidate }) => {
      const pc = createPeerConnection(from);
      if (candidate) await pc.addIceCandidate(candidate);
    });

    return () => {
      socket.off("room-state");
      socket.off("participants-update");
      socket.off("participant-joined");
      socket.off("participant-left");
      socket.off("screen-share-started");
      socket.off("screen-share-stopped");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
    };
  }, [socket, createOffer, createPeerConnection, closePeerConnection, isSharing]);

  const screenStream = isSharing
    ? myStream
    : remoteStreamRef.current || remoteStream;

  return (
    <div className="room-root">

      {/* Ambient gradient blob */}
      <div className="gradient-mid" />

      {/* ── TOPBAR ── */}
      <header className="room-topbar">
        <div className="room-id-tag">Room: {roomId}</div>

        <div className="room-participants-pill">
          {participants.length} participant{participants.length !== 1 ? "s" : ""}
        </div>

        {currentSharer && (
          <div className="room-sharer-notice">
            Sharing: {currentSharer.userId}
          </div>
        )}

        <button
          className={`room-share-btn ${isSharing ? "stop" : "start"}`}
          onClick={isSharing ? stopScreenShare : startScreenShare}
        >
          {isSharing ? "Stop Sharing" : "Share Screen"}
        </button>
      </header>

      {/* ── BODY ── */}
      <div className="room-body">

        {/* LEFT — Screen share */}
        <div className="room-screen-panel">
          <div className="room-panel-topbar">
            <span className="room-panel-label">Screen Share</span>
          </div>
          <div className="room-screen-content">
            {screenStream ? (
              <video
                className="room-video"
                autoPlay
                muted
                playsInline
                ref={(v) => v && (v.srcObject = screenStream)}
              />
            ) : (
              <div className="room-no-screen">
                <div className="room-no-screen-icon">🖥</div>
                <p>No screen being shared</p>
              </div>
            )}
          </div>
        </div>

        <div className="room-divider" />

        {/* RIGHT — Whiteboard */}
        <div className="room-whiteboard-panel">
          <div className="room-panel-topbar">
            <span className="room-panel-label">Whiteboard</span>
          </div>
          <div className="room-whiteboard-content">
            <Whiteboard />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Room;