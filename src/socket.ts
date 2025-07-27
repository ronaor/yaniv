import {io, Socket} from 'socket.io-client';

const SERVER_URL = 'http://10.108.104.37:3000/';

const socket: Socket = io(SERVER_URL, {
  transports: ['websocket'],
  autoConnect: false,
});

export default socket;
