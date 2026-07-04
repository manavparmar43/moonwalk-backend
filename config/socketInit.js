const { Server } = require('socket.io');
const { corsOrigin } = require('./envConfig');

let io = null;

function setIo(instance) {
  io = instance;
}

function initSocket(server) {
  const instance = new Server(server, { cors: { origin: corsOrigin } });
  instance.on('connection', (socket) => {
    socket.on('join', (room) => socket.join(room));
  });
  setIo(instance);
  return instance;
}

function getIo() {
  if (!io) throw new Error('Socket.io not initialized yet');
  return io;
}

module.exports = { initSocket, getIo, setIo };
