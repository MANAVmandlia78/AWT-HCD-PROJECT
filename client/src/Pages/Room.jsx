import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../Providers/Socket";
import Whiteboard from "./Whiteboard";
import Clipboard from "./Clipboard";
import "../Styles/room.css";

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

function getRoleFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

const initialState = {
  participants: [],
  currentSharer: null,
  myStream: null,
  remoteStream: null,
  isSharing: false,
  notice: "",
};

function roomReducer(state, action) {
  switch (action.type) {
    case "SET_PARTICIPANTS":
      return { ...state, participants: action.payload };
    case "SET_CURRENT_SHARER":
      return { ...state, currentSharer: action.payload };
    case "SET_MY_STREAM":
      return { ...state, myStream: action.payload };
    case "SET_REMOTE_STREAM":
      return { ...state, remoteStream: action.payload };
    case "SHARING_STARTED":
      return { ...state, isSharing: true, myStream: action.payload };
    case "SHARING_STOPPED":
      return { ...state, isSharing: false, myStream: null };
    case "SCREEN_SHARE_STOPPED":
      return { ...state, currentSharer: null, remoteStream: null };
    case "SET_NOTICE":
      return { ...state, notice: action.payload };
    case "ROOM_STATE":
      return {
        ...state,
        participants: action.payload.participants,
        currentSharer: action.payload.currentSharer,
      };
    default:
      return state;
  }
}

const Room = () => {
  const socket = useSocket();
  const { roomId } = useParams();
  const [state, dispatch] = useReducer(roomReducer, initialState);
  const { participants, currentSharer, myStream, remoteStream, isSharing, notice } = state;

  const [rightPanel, setRightPanel] = useState("whiteboard");
  const [volume, setVolume] = useState(80);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const roleRef = useRef(getRoleFromToken());
  const peersRef = useRef(new Map());
  const participantsRef = useRef([]);
  const remoteStreamRef = useRef(null);
  const myStreamRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => { participantsRef.current = participants; }, [participants]);
  useEffect(() => { myStreamRef.current = myStream; }, [myStream]);
  useEffect(() => { remoteStreamRef.current = remoteStream; }, [remoteStream]);

  // When remote stream arrives, attach it and try to play with audio
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !remoteStream || isSharing) return;
    v.srcObject = remoteStream;
    v.volume = volume / 100;
    v.muted = false;
    v.play()
      .then(() => setAudioUnlocked(true))
      .catch(() => {
        // Browser blocked autoplay with audio — mute and try again, show banner
        v.muted = true;
        v.play().catch(() => {});
        setAudioUnlocked(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteStream, isSharing]);

  // Keep volume in sync when slider changes
  useEffect(() => {
    if (videoRef.current && !isSharing) {
      videoRef.current.volume = volume / 100;
    }
  }, [volume, isSharing]);

  const unlockAudio = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.volume = volume / 100;
    v.play().catch(() => {});
    setAudioUnlocked(true);
  };

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
      if (stream) {
        remoteStreamRef.current = stream;
        dispatch({ type: "SET_REMOTE_STREAM", payload: stream });
      }
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
      dispatch({ type: "SET_NOTICE", payload: "Another user is already sharing" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => { t.onended = stopScreenShare; });
      dispatch({ type: "SHARING_STARTED", payload: stream });
      socket.emit("request-screen-share");
    } catch (err) {
      console.error(err);
    }
  };

  const stopScreenShare = () => {
    myStreamRef.current?.getTracks().forEach((t) => t.stop());
    dispatch({ type: "SHARING_STOPPED" });
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
      dispatch({ type: "ROOM_STATE", payload: { participants, currentSharer } });
    });
    socket.on("participants-update", ({ participants }) => {
      dispatch({ type: "SET_PARTICIPANTS", payload: participants });
    });
    socket.on("participant-joined", async ({ socketId }) => {
      if (isSharing) await createOffer(socketId);
    });
    socket.on("participant-left", ({ socketId }) => closePeerConnection(socketId));
    socket.on("screen-share-started", ({ sharerSocketId, userId }) => {
      dispatch({ type: "SET_CURRENT_SHARER", payload: { socketId: sharerSocketId, userId } });
      if (socket.id === sharerSocketId) {
        participantsRef.current.forEach((p) => {
          if (p.socketId !== socket.id) createOffer(p.socketId);
        });
      }
    });
    socket.on("screen-share-stopped", () => {
      dispatch({ type: "SCREEN_SHARE_STOPPED" });
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
  }, [socket, createOffer, createPeerConnection, closePeerConnection, isSharing, closeAllPeerConnections]);

  const screenStream = useMemo(
    () => isSharing ? myStream : remoteStream,
    [isSharing, myStream, remoteStream]
  );

  const volumeIcon = volume === 0 ? "🔇" : volume < 50 ? "🔉" : "🔊";

  return (
    <div className="room-root">
      <div className="gradient-mid" />

      {/* ── TOPBAR — info only ── */}
      <header className="room-topbar">
        <div className="room-id-tag">Room: {roomId}</div>
        {notice && <div className="room-sharer-notice">{notice}</div>}
        {currentSharer && !notice && (
          <div className="room-sharer-notice">Sharing: {currentSharer.userId}</div>
        )}
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
              <>
                {!audioUnlocked && !isSharing && (
                  <button className="room-audio-unlock-btn" onClick={unlockAudio}>
                    🔇 Click to enable audio
                  </button>
                )}
                <video
                  className="room-video"
                  autoPlay
                  playsInline
                  ref={(v) => {
                    videoRef.current = v;
                    if (v && isSharing) {
                      v.srcObject = screenStream;
                      v.muted = true;
                    }
                  }}
                />
              </>
            ) : (
              <div className="room-no-screen">
                <div className="room-no-screen-icon">🖥</div>
                <p>No screen being shared</p>
              </div>
            )}
          </div>
        </div>

        <div className="room-divider" />

        {/* ── RIGHT PANEL ── */}
        <div className="room-right-panel">
          <div className="room-panel-topbar room-panel-topbar--tabs">
            <button
              className={`room-panel-tab ${rightPanel === "whiteboard" ? "active" : ""}`}
              onClick={() => setRightPanel("whiteboard")}
            >
              ✏️ Whiteboard
            </button>
            <button
              className={`room-panel-tab ${rightPanel === "clipboard" ? "active" : ""}`}
              onClick={() => setRightPanel("clipboard")}
            >
              📋 Clipboard
              {roleRef.current === "teacher" && <span className="room-panel-tab-dot" />}
            </button>
          </div>

          <div
            className="room-panel-scroll"
            style={{ display: rightPanel === "whiteboard" ? "flex" : "none" }}
          >
            <div className="room-whiteboard-inner"><Whiteboard /></div>
          </div>

          <div
            className="room-panel-scroll room-panel-scroll--clipboard"
            style={{ display: rightPanel === "clipboard" ? "flex" : "none" }}
          >
            <Clipboard socket={socket} role={roleRef.current} roomId={roomId} />
          </div>
        </div>
      </div>

      {/* ── BOTTOM CONTROLS BAR ── */}
      <div className="room-controls-bar">

        {/* LEFT — Participants */}
        <div className="room-ctrl-group">
          <div className="room-ctrl-participants">
            <span className="room-ctrl-participants-icon">👥</span>
            <span className="room-ctrl-participants-count">{participants.length}</span>
            <span className="room-ctrl-participants-label">
              Participant{participants.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* CENTER — Share button */}
        <div className="room-ctrl-group room-ctrl-group--center">
          <button
            className={`room-ctrl-share-btn ${isSharing ? "stop" : "start"}`}
            onClick={isSharing ? stopScreenShare : startScreenShare}
          >
            <span className="room-ctrl-share-icon">{isSharing ? "⏹" : "🖥"}</span>
            {isSharing ? "Stop Sharing" : "Share Screen"}
          </button>
        </div>

        {/* RIGHT — Volume */}
        <div className="room-ctrl-group room-ctrl-group--right">
          <div className={`room-ctrl-volume ${isSharing ? "room-ctrl-volume--disabled" : ""}`}>
            <button
              className="room-ctrl-vol-icon-btn"
              onClick={() => {
                const next = volume === 0 ? 80 : 0;
                setVolume(next);
                if (videoRef.current) videoRef.current.volume = next / 100;
              }}
              disabled={isSharing}
              title={isSharing ? "Volume controls apply to received audio only" : "Toggle mute"}
            >
              {volumeIcon}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              disabled={isSharing}
              className="room-ctrl-vol-slider"
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                if (videoRef.current) videoRef.current.volume = v / 100;
              }}
            />
            <span className="room-ctrl-vol-label">{volume}%</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Room;