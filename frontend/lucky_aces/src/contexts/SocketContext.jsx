import { createContext, useContext, useState, useEffect } from "react";
import { useLoggedInUser } from "./LoggedInUserContext";
import { io } from "socket.io-client";

const REACT_APP_BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";
const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { token, user } = useLoggedInUser();
  const [unreadNotification, setUnreadNotification] = useState(false);
  const [newNotification, setNewNotification] = useState(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }
    const newSocket = createSocket(token);
    setSocket(newSocket);

    // cleanup function
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [token]);

  useEffect(() => {
    if (!socket || !user) return;

    // console.log("Sending auth to socket:", user.id);
    // socket.emit("auth", user.id);

  }, [socket, user]);

  return (
    <SocketContext.Provider value={{ socket, unreadNotification, setUnreadNotification, newNotification, setNewNotification }}>
      {children}
    </SocketContext.Provider>
  );

  function createSocket(token) {
    // const socket = io(import.meta.env.VITE_BACKEND_WS_URL, {
    //   auth: { token },
    // });
    const socket = io(REACT_APP_BACKEND_URL, {
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("WS connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("WS connect_error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("WS disconnected:", reason);
    });

    // listen for test events from the backend
    socket.on("notification", (data) => {
      setUnreadNotification(true);
      setNewNotification(data);
      console.log("WS notification:", data);
    });

    socket.on("connect_error", (error) => {
      console.log("Connection error:", error);
    });

    return socket;
  }
}

export function useSocket() {
  return useContext(SocketContext);
}
