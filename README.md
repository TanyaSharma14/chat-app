💬 Real-Time Chat Application
A scalable real-time chat application built using modern web technologies, designed to provide seamless communication with features like private messaging, group chats, typing indicators, and read receipts.
-------------------------------------------------------------------
🚀 Project Overview
This project focuses on building a real-time communication system that feels fast and responsive while ensuring reliable message storage and user authentication.

It combines REST APIs + WebSockets to handle both structured data flow and instant updates.
------------------------------------------------------------------- 
🏗️ Architecture & Tech Stack
Backend
Node.js + Express – API handling

Socket.IO – Real-time communication

MongoDB + Mongoose – Database

JWT – Authentication

bcryptjs – Password hashing

Frontend
HTML, CSS, JavaScript
Socket.IO client for real-time updates
Infrastructure (Scalability-Oriented)
Docker & Docker Compose
Nginx (load balancing)

Optional Redis for horizontal scaling
📁 Project Structure
chat-app/
├── server/
│   ├── server.js        # Main backend + Socket.IO server

│   ├── config/          # DB connection

│   ├── models/          # User, Room, Message schemas

│   ├── routes/          # Auth & chat APIs

│   └── middleware/      # JWT authentication
├── public/

│   ├── index.html       # Login/Register UI

│   ├── chat.html        # Chat UI

│   ├── js/              # Frontend logic

│   └── css/             # Styling

├── nginx/               # Load balancer config

├── Dockerfile

└── docker-compose.yml
✨ Key Features

🔥 Real-Time Messaging
Instant message delivery using Socket.IO

Typing indicators
Message read/delivery status

👤 User Management
Secure login & registration using JWT

Password hashing with bcrypt

Online/offline status tracking
💬 Chat System
Private one-on-one chats

Group chat support

Message history retrieval
📎 Advanced Features

Image/file sharing
Message deletion (unsend)
Read receipts

------------------------------------------------------------------- 

⚙️ How It Works (Flow)
User logs in → JWT token generated

Frontend stores token and connects via Socket.IO

Socket is authenticated using JWT

User joins a chat room

Messages are:

Saved in MongoDB

Broadcast instantly via WebSockets

UI updates in real-time without refresh

📦 Setup Instructions

1. Clone the repository
git clone <repo-link>

cd chat-app
2. Install dependencies
cd server
npm install
3. Set environment variables

Create a .env file:

MONGO_URI=your_mongodb_connection

JWT_SECRET=your_secret_key

PORT=5000

4. Run the server
npm run dev

6. Open in browser
http://localhost:5000
🧠 Design Decisions

Used Socket.IO instead of polling → reduces latency

Chose JWT auth → stateless and scalable

Stored messages in MongoDB → easy schema flexibility

Optional Redis adapter → supports multi-server scaling

📈 Scalability Considerations

Stateless backend using JWT

Horizontal scaling via multiple server instances

Redis pub/sub (optional) for cross-instance communication

Load balancing using Nginx
------------------------------------------------------------------- 
🎯 What I Learned

Real-time systems using WebSockets

Authentication and secure API design

Handling async flows between frontend and backend

Designing scalable backend architecture
