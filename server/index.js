const io = require("socket.io")(3000, {
  cors: { origin: ["http://localhost:4200", "https://skycader.github.io"] },
});

const online = {};
const last100 = [];
io.on("connection", (socket) => {
  online[socket.id] = true;
  io.emit("current-online", Object.keys(online).length);
  socket.emit("last100", last100);

  socket.on("disconnect", () => {
    delete online[socket.id];
    io.emit("current-online", Object.keys(online).length);
  });
  socket.on("message", (username, message) => {
    io.emit("message", username, message, new Date());
    last100.unshift({ username, message });
    last100.splice(100);
  });
});
