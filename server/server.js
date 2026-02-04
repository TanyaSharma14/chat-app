require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const connectDB = require("./config/db");
const Message = require("./models/Message");
const validateMessage = require("./utils/validateMessage");

const authRoutes = require("./routes/auth");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Serve frontend
app.use(express.static("../public"));

// Socket authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) return next(new Error("Authentication error"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded.username;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.user);

  socket.on("joinChat", async ({ toUser }) => {
    socket.toUser = toUser;

    const history = await Message.find({
      from: { $in: [socket.user, toUser] },
      to: { $in: [socket.user, toUser] },
    })
      .sort({ timestamp: -1 })
      .limit(50);

    socket.emit("history", history.reverse());
  });

  socket.on("chatMessage", async ({ toUser, message }) => {
    if (!validateMessage(message)) return;

    const msg = new Message({
      from: socket.user,
      to: toUser,
      message,
    });

    await msg.save();

    socket.emit("message", msg);
    socket.broadcast.emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
