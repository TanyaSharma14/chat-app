const API = "/api/auth";

window.addEventListener("DOMContentLoaded", () => {
  console.log("auth.js loaded ✅"); // if you don't see this, file isn't loading
});

async function register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    document.getElementById("status").innerText = "Enter username + password";
    return;
  }

  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => ({}));
    console.log("Register:", res.status, data);

    document.getElementById("status").innerText =
      data.message || `Register status: ${res.status}`;
  } catch (err) {
    console.error("Register failed:", err);
    document.getElementById("status").innerText = "Register failed (check console)";
  }
}

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  if (!username || !password) {
    document.getElementById("status").innerText = "Enter username + password";
    return;
  }

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => ({}));
    console.log("Login:", res.status, data);

    if (data.token) {
      localStorage.setItem("token", data.token);
      window.location.href = "/chat.html";
      return;
    }

    document.getElementById("status").innerText =
      data.message || `Login failed (status ${res.status})`;
  } catch (err) {
    console.error("Login failed:", err);
    document.getElementById("status").innerText = "Login failed (check console)";
  }
}
