// server/server.js

const express = require("express");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(cors());

const DATA_FILE = "./users.json";

/* ================= ENV VARIABLES ================= */

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

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

/* ================= REGISTER ================= */

app.post("/register", (req, res) => {
  const users = loadUsers();
  const { username, password } = req.body;

  if (!username || !password) {
    return res.send("Fill all fields");
  }

  if (users.find(u => u.username === username)) {
    return res.send("User already exists");
  }

  users.push({
    username,
    password,
    robloxUsername: "",
    robloxUserId: "",
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
    return res.send("User not found");
  }

  if (user.password !== password) {
    return res.send("Wrong password");
  }

  res.json({
    message: "Login success",
    username: user.username,
    robloxUsername: user.robloxUsername,
    balance: user.balance,
    totalWagered: user.totalWagered
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

  res.send("User updated");
});

/* ================= VERIFY PURCHASE ================= */

app.post("/verifyPurchase", (req, res) => {
  const users = loadUsers();

  const {
    robloxUsername,
    credits
  } = req.body;

  const user = users.find(
    u => u.robloxUsername === robloxUsername
  );

  if (!user) {
    return res.send("User not found");
  }

  user.balance += Number(credits);

  saveUsers(users);

  res.send("Credits added");
});

/* ================= ROBLOX AUTH START ================= */

app.get("/auth/roblox", (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.send("Missing website username");
  }

  const authUrl =
    `https://apis.roblox.com/oauth/v1/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=openid profile` +
    `&state=${username}`;

  console.log("Redirecting to:", authUrl);

  res.redirect(authUrl);
});

/* ================= ROBLOX AUTH CALLBACK ================= */

app.get("/auth/roblox/callback", async (req, res) => {
  const code = req.query.code;
  const websiteUsername = req.query.state;

  if (!code) {
    return res.send(
      "OAuth failed — no code returned"
    );
  }

  try {
    const tokenRes = await axios.post(
      "https://apis.roblox.com/oauth/v1/token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI
      }
    );

    console.log(
      "OAuth Success:",
      tokenRes.data
    );

    /*
      TEMP placeholder until full profile lookup
    */
    const verifiedRobloxUsername =
      "VerifiedRobloxUser";

    const verifiedRobloxUserId =
      "123456";

    const users = loadUsers();

    const user = users.find(
      u => u.username === websiteUsername
    );

    if (!user) {
      return res.send(
        "Website account not found"
      );
    }

    user.robloxUsername =
      verifiedRobloxUsername;

    user.robloxUserId =
      verifiedRobloxUserId;

    saveUsers(users);

    res.send(
      "Roblox account linked successfully. Return to website."
    );

  } catch (err) {
    console.log(
      "OAuth Error:",
      err.response?.data || err.message
    );

    res.send(
      "OAuth verification failed"
    );
  }
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});