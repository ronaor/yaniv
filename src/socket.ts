import {io, Socket} from 'socket.io-client';
import {SERVER_URL} from '@env';

const serverUrl = SERVER_URL || 'http://10.108.104.37:3000/';
console.log('SERVER_URL from @env:', SERVER_URL);

const socket: Socket = io(serverUrl, {
  transports: ['websocket'],
  autoConnect: false,
});

export default socket;
