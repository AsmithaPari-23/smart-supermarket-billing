import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [pendingRoomCode, setPendingRoomCode] = useState('');
  const [scannerConnected, setScannerConnected] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [unregisteredBarcode, setUnregisteredBarcode] = useState(null);

  useEffect(() => {
    // Connect to backend Socket.IO server (relying on vite proxy or environment variable in production)
    const backendUrl = import.meta.env.VITE_API_URL || window.location.origin;
    const newSocket = io(backendUrl, {
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('Socket client connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket client disconnected');
      setConnected(false);
      setScannerConnected(false);
    });

    newSocket.on('device-connected', () => {
      console.log('Scanner device linked successfully');
      setScannerConnected(true);
    });

    newSocket.on('product-found', (product) => {
      console.log('Real-time scanned product found:', product.name);
      setScannedProduct(product);
      // Reset after emission
      setTimeout(() => setScannedProduct(null), 100);
    });

    newSocket.on('product-not-found', (data) => {
      console.log('Scanned barcode not registered:', data.barcode);
      setUnregisteredBarcode(data.barcode);
      setTimeout(() => setUnregisteredBarcode(null), 100);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Emit join-session as soon as socket connects and pendingRoomCode is set
  useEffect(() => {
    if (socket && connected && pendingRoomCode) {
      socket.emit('join-session', pendingRoomCode);
      console.log('Socket successfully joined room:', pendingRoomCode);
    }
  }, [socket, connected, pendingRoomCode]);

  const joinSession = useCallback((code) => {
    setPendingRoomCode(code);
    setRoomCode(code);
  }, []);

  const sendBarcode = useCallback((barcode, code = roomCode) => {
    const targetCode = code || roomCode;
    if (socket && barcode && targetCode) {
      socket.emit('barcode-scanned', { roomCode: targetCode, barcode });
    }
  }, [socket, roomCode]);

  const value = {
    socket,
    connected,
    roomCode,
    joinSession,
    sendBarcode,
    scannerConnected,
    scannedProduct,
    unregisteredBarcode
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
