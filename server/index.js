const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Document schema
const Document = mongoose.model('Document', new mongoose.Schema({
  _id: String,
  content: Object,
}));

// Socket.IO logic
io.on('connection', socket => {
  socket.on('get-document', async documentId => {
    const document = await Document.findById(documentId) || await Document.create({ _id: documentId, content: '' });
    socket.join(documentId);
    socket.emit('load-document', document.content);

    socket.on('send-changes', delta => {
      socket.broadcast.to(documentId).emit('receive-changes', delta);
    });

    socket.on('save-document', async data => {
      await Document.findByIdAndUpdate(documentId, { content: data });
    });
  });
});

server.listen(3001, () => console.log('Server running on port 3001'));
