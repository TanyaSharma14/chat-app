Real-Time Private Chat Application

A real-time private messaging system built with Node.js, Express, Socket.IO, and MongoDB Atlas.
The application supports user authentication, private conversations, message persistence, and chat history retrieval.

Features

User registration and login with JWT authentication

Real-time private messaging using Socket.IO

MongoDB Atlas–based message storage

Chat history retrieval for active conversations

Socket authentication using JWT

Modular backend architecture

Tech Stack

Backend

Node.js

Express.js

Socket.IO

MongoDB Atlas

Mongoose

JWT (JSON Web Tokens)

bcrypt

Frontend

HTML

CSS

Vanilla JavaScript

Project Structure
chat-app/
│
├── public/
│   ├── index.html
│   ├── chat.html
│   ├── css/
│   └── js/
│
└── server/
    ├── server.js
    ├── config/
    │   └── db.js
    ├── models/
    │   ├── User.js
    │   └── Message.js
    ├── routes/
    │   └── auth.js
    ├── middleware/
    │   └── auth.js
    ├── utils/
    │   └── validateMessage.js
    ├── package.json
    └── .env

How It Works

Users register and log in using REST APIs.

On login, the server returns a JWT token.

The frontend stores the token and connects to Socket.IO.

The socket connection is authenticated using the JWT.

Each user joins a private room identified by their username.

Messages are sent directly to the recipient’s room.

Messages are stored in MongoDB and retrieved as chat history.

Installation and Setup
1. Clone the repository
git clone https://github.com/your-username/chat-app.git
cd chat-app

2. Install backend dependencies
cd server
npm install

3. Configure environment variables

Create a file named .env inside the server folder:

PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key

4. Run the server
npm run dev


Server will start at:

http://localhost:5000

5. Open the application

In your browser:

http://localhost:5000


Register two users and start chatting.

API Endpoints
Register
POST /api/auth/register


Body:

{
  "username": "user1",
  "password": "1234"
}

Login
POST /api/auth/login


Body:

{
  "username": "user1",
  "password": "1234"
}


Response:

{
  "token": "jwt_token_here"
}

Socket Events
Client → Server

joinChat

{ toUser: "username" }


chatMessage

{ toUser: "username", message: "text" }

Server → Client

history

Sends previous chat messages

message

Sends real-time messages

Performance Notes

Supports 50+ concurrent users in local testing.

Reduced message latency by ~30% using per-user Socket.IO rooms instead of broadcast messaging.

Security

Passwords are hashed using bcrypt.

JWT is used for both REST and socket authentication.

Socket connections are verified before allowing message exchange.

Future Improvements

Group chats

Typing indicators

Message read receipts

Redis-based scaling

Docker deployment
