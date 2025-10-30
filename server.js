const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;

const rooms = { general: [] };

app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
  const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  res.json({ url: base64 });
});

io.on('connection', (socket) => {
  const username = socket.handshake.query.username || 'Anonyme';
  const room = socket.handshake.query.room || 'general';
  socket.join(room);
  socket.data.username = username;

  const history = rooms[room] || [];
  socket.emit('history', history.slice(-200));
  socket.to(room).emit('user:join', { user: username });

  socket.on('message', (msg) => {
    const message = {
      id: Date.now() + Math.random().toString(36).slice(2, 8),
      user: socket.data.username,
      text: msg.text || '',
      time: Date.now(),
      type: msg.type || 'text',
      meta: msg.meta || {}
    };
    rooms[room] = rooms[room] || [];
    rooms[room].push(message);
    if (rooms[room].length > 1000) rooms[room].shift();

    io.to(room).emit('message', message);
  });

  socket.on('typing', (isTyping) => {
    socket.to(room).emit('typing', { user: socket.data.username, typing: !!isTyping });
  });

  socket.on('disconnect', () => {
    socket.to(room).emit('user:leave', { user: socket.data.username });
  });
});

server.listen(PORT, () => console.log(`✅ Serveur démarré sur http://localhost:${PORT}`));