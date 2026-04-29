// server/server.js

const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const path = require("path");
const DATA_FILE = path.join(__dirname, "users.json");

/* ================= FILE SYSTEM ================= */

function loadUsers() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]");
  }

  return JSON.parse(
    fs.readFileSync(DATA_FILE)
  );
}

function saveUsers(users) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(users, null, 2)
  );
}

/* ================= HOME ROUTE ================= */

app.get("/", (req, res) => {
  res.send("Casino backend is live");
});

/* ================= REGISTER ================= */

app.post("/register", (req, res) => {
  const users = loadUsers();
  const { username, password } = req.body;

  if (!username || !password) {
    return res.send("Fill all fields");
  }

  const existingUser = users.find(
    u => u.username === username
  );

  if (existingUser) {
    return res.send("User already exists");
  }

  users.push({
    username,
    password,
    robloxUsername: "",
    balance: 100,
    totalWagered: 0
  });

  saveUsers(users);

console.log("Saving user:", username);

  res.send("Account created");
});

/* ================= LOGIN ================= */

app.post("/login", (req, res) => {
  const users = loadUsers();
  const { username, password } = req.body;

  /* ---------- ADMIN LOGIN ---------- */

  if (
  (username === "kelpkoi1" && password === "goated1234") ||
  (username === "badmon" && password === "badmongoated") ||
  (username === "kelpkoi2" && password === "goated1234")
) {
    return res.json({
      message: "Admin login",
      isAdmin: true,
      username: "admin"
    });
  }

  /* ---------- NORMAL USER LOGIN ---------- */

  const user = users.find(
    u => u.username === username
  );

  if (!user) {
    return res.json({
      message: "User not found"
    });
  }

  if (user.password !== password) {
    return res.json({
      message: "Wrong password"
    });
  }

  res.json({
    message: "Login success",
    username: user.username,
    robloxUsername: user.robloxUsername || "",
    balance: user.balance || 0,
    totalWagered: user.totalWagered || 0
  });
});

/* ADMIN CHANGE BALANCE */

app.post("/admin/changeBalance", (req, res) => {
  const users = loadUsers();
  const { username, amount } = req.body;

  const user = users.find(
    u => u.username === username
  );

  if (!user) {
    return res.send("User not found");
  }

  user.balance = (user.balance || 0) + amount;

  if (user.balance < 0) {
    user.balance = 0;
  }

  saveUsers(users);
  res.send("Balance updated");
});


/* ADMIN DELETE USER */

app.post("/admin/deleteUser", (req, res) => {
  let users = loadUsers();
  const { username } = req.body;

  users = users.filter(
    u => u.username !== username
  );

  saveUsers(users);
  res.send("User deleted");
});

/* ================= ADMIN VIEW ALL USERS ================= */

app.get("/admin/users", (req, res) => {
  const users = loadUsers();

  res.json(users);
});

/* ================= UPDATE USER ================= */

app.post("/updateUser", (req, res) => {
  const users = loadUsers();

  const {
    username,
    balance,
    totalWagered,
    robloxUsername
  } = req.body;

  const user = users.find(
    u => u.username === username
  );

  if (!user) {
    return res.send("User not found");
  }

  user.balance = balance;
  user.totalWagered = totalWagered;
  user.robloxUsername = robloxUsername;

  saveUsers(users);

  res.send("Updated");
});

/* ================= ROBLOX LINK PLACEHOLDER ================= */

app.get("/auth/roblox", (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.send("Missing username");
  }

  res.send(
    `Roblox OAuth route ready for user: ${username}`
  );
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});