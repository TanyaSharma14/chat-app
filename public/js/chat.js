const socket = io({
  auth: {
    token: localStorage.getItem("token"),
  },
});

const chatForm = document.getElementById("chat-form");
const msgInput = document.getElementById("msg");
const messages = document.getElementById("messages");

let toUser = "";

function joinChat() {
  toUser = document.getElementById("toUser").value;
  socket.emit("joinChat", { toUser });
}

socket.on("history", (history) => {
  messages.innerHTML = "";
  history.forEach(displayMessage);
});

socket.on("message", (msg) => {
  displayMessage(msg);
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const msg = msgInput.value;
  if (!msg) return;

  socket.emit("chatMessage", { toUser, message: msg });
  msgInput.value = "";
});

function displayMessage(msg) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerText = `${msg.from}: ${msg.message}`;
  messages.appendChild(div);
}
