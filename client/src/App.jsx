import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Room from "./Pages/Room";
import { SocketProvider } from "./Providers/Socket";
import { PeerProvider } from "./Providers/Peer";

const App = () => {
  return (
    <div>
      <SocketProvider>
        <PeerProvider>
          <Routes>
            <Route path="/" element={<Home></Home>}></Route>
            <Route path="/room/:roomId" element={<Room></Room>}></Route>
          </Routes>
        </PeerProvider>
      </SocketProvider>
    </div>
  );
};

export default App;
