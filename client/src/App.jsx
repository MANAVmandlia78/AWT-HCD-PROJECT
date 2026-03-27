import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import LandingPage from "./Pages/LandingPage";
import Room from "./Pages/Room";
import { SocketProvider } from "./Providers/Socket";
import { PeerProvider } from "./Providers/Peer";
import LMSmain from "./Pages/LMSmain";

const App = () => {
  return (
    <div>
      <SocketProvider>
        <PeerProvider>
          <Routes>
            {/* <Route path="/" element={<LandingPage></LandingPage>}></Route> */}
            <Route path="/" element={<LMSmain></LMSmain>}></Route>
            <Route path="/home" element={<Home></Home>}></Route>
            <Route path="/room/:roomId" element={<Room></Room>}></Route>
          </Routes>
        </PeerProvider>
      </SocketProvider>
    </div>
  );
};

export default App;
