export const SOCKET_EVENTS = {
  CONNECTION_READY: 'connection:ready',
  PRESENCE_UPDATED: 'presence:updated',
  ROOM_USER_JOINED: 'room:user-joined',
  ROOM_USER_LEFT: 'room:user-left',
  MESSAGE_CREATED: 'message:created',
  MESSAGE_ERROR: 'message:error',
  TYPING_STARTED: 'typing:started',
  TYPING_STOPPED: 'typing:stopped',
  CONVERSATION_READ: 'conversation:read',
} as const;
