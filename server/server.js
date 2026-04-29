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
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, "[]");
    }

    const data = fs.readFileSync(DATA_FILE, "utf8");

    if (!data || data.trim() === "") {
      fs.writeFileSync(DATA_FILE, "[]");
      return [];
    }

    return JSON.parse(data);

  } catch (error) {
    console.log("users.json error:", error);
    fs.writeFileSync(DATA_FILE, "[]");
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(users, null, 2),
    "utf8"
  );

  console.log("Users saved successfully");
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

/* ================= CHANGE USERNAME ================= */

app.post("/changeUsername", (req, res) => {
  const users = loadUsers();

  const { oldUsername, newUsername } = req.body;

  if (!oldUsername || !newUsername) {
    return res.send("Missing username data");
  }

  const existingUser = users.find(
    u =>
      u.username.toLowerCase() ===
      newUsername.toLowerCase()
  );

  if (existingUser) {
    return res.send("Username already taken");
  }

  const user = users.find(
    u => u.username === oldUsername
  );

  if (!user) {
    return res.send("Original user not found");
  }

  user.username = newUsername;

  saveUsers(users);

  res.send("Username updated");
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

app.get("/auth/roblox/callback", async (req, res) => {
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
      String(u.username).trim().toLowerCase() ===
      String(username).trim().toLowerCase()
  );

  if (!user) {
    return res.send(`User not found: ${username}`);
  }

  try {
    const tokenResponse = await fetch(
      "https://apis.roblox.com/oauth/v1/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          client_id: "7447348537567881366",
          client_secret: "RBX-80aSmPCxA0OVeM2S8ci4bfhHJJbGtm_zlq_17tGKlYHsLAo-l3-za3ga0M4D0A1x",
          redirect_uri:
            "https://casino-backend-nah2.onrender.com/auth/roblox/callback"
        })
      }
    );

    const tokenText = await tokenResponse.text();
console.log("TOKEN RAW RESPONSE:", tokenText);

const tokenData = JSON.parse(tokenText);
console.log("TOKEN DATA:", tokenData);
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.send("Failed to get Roblox access token");
    }

   const userInfoResponse = await fetch(
  "https://apis.roblox.com/oauth/v1/userinfo",
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  }
);

const robloxData = await userInfoResponse.json();

console.log("ROBLOX USER DATA:", robloxData);

user.robloxUsername =
  robloxData.preferred_username ||
  robloxData.name ||
  robloxData.sub ||
  "Linked Roblox Account";

    saveUsers(users);

    return res.redirect(
      "https://dope-casino.vercel.app/?refreshUser=true"
    );

 } catch (error) {
  console.log("ROBLOX FULL ERROR:", error);

  return res.send(
    `Roblox link failed: ${error.message}`
  );
}
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