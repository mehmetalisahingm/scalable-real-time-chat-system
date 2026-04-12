import { io } from 'socket.io-client';

export function createChatSocket(token: string) {
  return io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000', {
    autoConnect: true,
    transports: ['websocket'],
    auth: {
      token,
    },
  });
}
