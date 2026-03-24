import React, { useMemo } from 'react'
import { io } from 'socket.io-client'

const SocketContext = React.createContext(null);

export const useSocket = () => {
  return React.useContext(SocketContext)
}

export const SocketProvider = (props) => {
  // ❌ Original localhost version
  const socket = useMemo(() => io('http://localhost:8000'), [])

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  )
}