import type { Server } from 'socket.io';

let socketServer: Server | null = null;

export function setSocketServer(io: Server) {
  socketServer = io;
}

export function getSocketServer() {
  if (!socketServer) {
    throw new Error('Socket server has not been initialized.');
  }

  return socketServer;
}
