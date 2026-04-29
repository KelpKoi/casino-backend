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
  totalWagered: 0,
  profilePicture: ""
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

  return res.json({
  message: "Login success",
  username: user.username,
  robloxUsername: user.robloxUsername || "",
  balance: user.balance || 0,
  totalWagered: user.totalWagered || 0,
  profilePicture: user.profilePicture || ""
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
  robloxUsername,
  profilePicture
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
  user.profilePicture = profilePicture || "";

  saveUsers(users);

  res.send("Updated");
});

/* ================= ROBLOX LINK PLACEHOLDER ================= */

app.get("/auth/roblox", (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.send("Missing username");
  }

  const clientId = "7447348537567881366";

  const redirectUri =
    "https://casino-backend-nah2.onrender.com/auth/roblox/callback";

  const robloxURL =
    `https://apis.roblox.com/oauth/v1/authorize?` +
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=openid profile` +
    `&state=${encodeURIComponent(username)}`;

  res.redirect(robloxURL);
});

/* ================= ROBLOX CALLBACK ================= */

app.get("/auth/roblox/callback", (req, res) => {
  const code = req.query.code;
  const username = req.query.state;

  if (!code) {
    return res.send("Authorization failed");
  }

  if (!username) {
    return res.send("No username returned from Roblox");
  }

  const users = loadUsers();

  const user = users.find(
    u =>
      u.username.toLowerCase() ===
      String(username).toLowerCase()
  );

  if (!user) {
    return res.send(`User not found: ${username}`);
  }

  user.robloxUsername = "Linked Roblox Account";

  saveUsers(users);

 return res.redirect(
  "https://dope-casino.vercel.app/?refreshUser=true"
);
});

/* ================= GET USER DATA ================= */

app.get("/user/:username", (req, res) => {
  const users = loadUsers();
  const username = req.params.username;

  const user = users.find(
    u => u.username === username
  );

  if (!user) {
    return res.json({
      message: "User not found"
    });
  }

  return res.json({
    username: user.username,
    balance: user.balance || 0,
    totalWagered: user.totalWagered || 0,
    robloxUsername: user.robloxUsername || "",
    profilePicture: user.profilePicture || ""
  });
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});