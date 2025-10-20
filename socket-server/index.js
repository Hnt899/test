// socket-server/index.js
// Простой ретранслятор событий: всё, что пришло — рассылаем всем.
// Запуск: node socket-server/index.js  (или npm run socket)

const { Server } = require("socket.io");

const io = new Server({
  cors: { origin: "*" }, // для локалки пускаем всех
});

// Лог подключения и ретрансляция любых событий
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Любое событие, пришедшее от клиента — рассылаем всем
  socket.onAny((event, payload) => {
    console.log("event:", event, "payload:", payload);
    io.emit(event, payload);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
io.listen(PORT);
console.log(`Socket server on http://localhost:${PORT}`);
