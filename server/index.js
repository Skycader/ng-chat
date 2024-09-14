const io = require("socket.io")(3000, {
  cors: { origin: ["http://localhost:4200", "https://skycader.github.io"] },
});

const online = {};
const rooms = {};
const last100 = [];
io.on("connection", (socket) => {
  console.log(online);
  online[socket.id] = true;
  io.emit("current-online", Object.keys(online).length);
  socket.emit("last100", last100);

  socket.on("disconnect", () => {
    delete online[socket.id];
    clearRooms(socket);
    io.emit("current-online", Object.keys(online).length);
  });
  socket.on("message", (username, message, roomId = "") => {
    if (roomId === "") {
      io.emit("message", username, message, new Date());
      last100.unshift({ username, message, date: new Date() });
      last100.splice(100);
    } else {
      io.to(roomId).emit("message", username, message, new Date());
    }
  });

  socket.on("private-msg", (userId, username, message) => {
    io.to(userId).emit("private-msg", username, message, new Date());
  });

  socket.on("join-room", (roomId) => {
    socket.leave(getSocketsRoom(socket));
    clearRooms(socket);

    socket.join(roomId);
    setRooms(socket, roomId);
    socket.emit("room-join", [...socket.rooms].slice(1));
    if (roomId === "") socket.emit("room-join", "");

    socket.emit("current-online", Object.keys(rooms[roomId]).length);
    socket.broadcast.emit("current-online", Object.keys(online).length);
  });

  socket.on("leave-all-rooms", () => {
    clearRooms(socket);
    socket.leave([...socket.rooms].slice(1)[0]);
    socket.emit("leave-all-rooms");
    online[socket.id] = true;
    io.emit("current-online", Object.keys(online).length);
  });
});

const setRooms = (socket, roomId) => {
  delete online[socket.id];
  if (!rooms[roomId]) rooms[roomId] = {};
  rooms[roomId][socket.id] = true;
};
const clearRooms = (socket) => {
  if (
    rooms[getSocketsRoom(socket)] &&
    rooms[getSocketsRoom(socket)][socket.id]
  ) {
    delete rooms[getSocketsRoom(socket)][socket.id];
    delete rooms[getSocketsRoom(socket)];
  }
};

const getSocketsRoom = (socket) => [...socket.rooms].slice(1)[0];
