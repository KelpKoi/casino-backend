// server/server.js

const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

const DATA_FILE = "./users.json";

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

  res.send("Account created");
});

/* ================= LOGIN ================= */

app.post("/login", (req, res) => {
  const users = loadUsers();
  const { username, password } = req.body;

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