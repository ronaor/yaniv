import {io, Socket} from 'socket.io-client';
// import {SERVER_URL} from '@env';
const SERVER_URL = 'http://10.100.102.11:3000/';

const serverUrl = SERVER_URL ?? 'https://yaniv-backend.onrender.com';

const socket: Socket = io(serverUrl, {
  transports: ['polling', 'websocket'],
  autoConnect: false,
});

export default socket;
