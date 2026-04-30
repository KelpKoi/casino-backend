const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const supabase = createClient(
  "https://ehrwgafswlrnadsjqiwt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocndnYWZzd2xybmFkc2pxaXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MTA4MDUsImV4cCI6MjA5MzA4NjgwNX0.DPifZcnnCalNNcEVgPxOzkox33A1lCAkWQQk5Igqwac"
);


app.get("/auth/roblox", (req, res) => {
  const username = req.query.username;

  const redirectUri = "https://casino-backend-nah2.onrender.com/auth/roblox/callback";

  const url = `https://apis.roblox.com/oauth/v1/authorize?client_id=7447348537567881366&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid profile&state=${username}`;

  res.redirect(url);
});

app.get("/auth/roblox/callback", async (req, res) => {
  const code = req.query.code;
  const username = req.query.state;

  if (!code) return res.send("No code");

  try {
    const tokenRes = await fetch("https://apis.roblox.com/oauth/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: "7447348537567881366",
        client_secret: "RBX-80aSmPCxA0OVeM2S8ci4bfGbNAEEww6Eqcb191IzOzczXjB_Om--1UrYCHU3pzsX",
        redirect_uri: "https://casino-backend-nah2.onrender.com/auth/roblox/callback"
      })
    });

  const tokenData = await tokenRes.json();
console.log("TOKEN RESPONSE:", tokenData);

if (!tokenData.access_token) {
  return res.send("OAuth failed: " + JSON.stringify(tokenData));
}
    const accessToken = tokenData.access_token;

    const userRes = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

   const userData = await userRes.json();
console.log("USER DATA:", userData);

if (!userData.name) {
  return res.send("Failed to get Roblox user: " + JSON.stringify(userData));
}

    // SAVE TO SUPABASE
    await supabase
      .from("users")
      .update({
        robloxUsername: userData.name
      })
      .eq("username", username);

    // redirect back to your site
    res.redirect("https://dope-casino.vercel.app/"); // <-- CHANGE THIS

  } catch (err) {
  console.log("OAUTH ERROR:", err);
  res.send("OAuth failed: " + err.message);
}
});

/* ================= HOME ================= */
app.get("/", (req, res) => {
  res.send("Casino backend running");
});

/* ================= REGISTER ================= */
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (existing) return res.send("User already exists");

  const { error } = await supabase.from("users").insert([{
    username,
    password,
    ipAddress: req.ip,
    robloxUsername: "",
    balance: 100,
    totalWagered: 0,
    profilePicture: "",
    banned: false
  }]);

  if (error) return res.json(error);

  res.send("Account created");
});

/* ================= LOGIN ================= */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (
    (username === "kelpkoi1" && password === "goated1234") ||
    (username === "badmon" && password === "Joell0726") ||
    (username === "kelpkoi2" && password === "goated1234")
  ) {
    return res.json({
      message: "Admin login",
      isAdmin: true,
      username: "admin"
    });
  }

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (!user) return res.json({ message: "User not found" });
  if (user.banned) return res.json({ message: "This account is banned" });
  if (user.password !== password) return res.json({ message: "Wrong password" });

  return res.json({
    message: "Login success",
    username: user.username,
    robloxUsername: user.robloxUsername || "",
    balance: user.balance || 0,
    totalWagered: user.totalWagered || 0,
    profilePicture: user.profilePicture || ""
  });
});

/* ================= UPDATE USER ================= */
app.post("/updateUser", async (req, res) => {
  const { username, balance, totalWagered, robloxUsername, profilePicture } = req.body;

  await supabase
    .from("users")
    .update({ balance, totalWagered, robloxUsername, profilePicture })
    .eq("username", username);

  res.send("Updated");
});

/* ================= GET USER ================= */
app.get("/user/:username", async (req, res) => {
  const { username } = req.params;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (!user) return res.json({ message: "User not found" });

  res.json(user);
});

/* ================= ADMIN ================= */

app.get("/admin/users", async (req, res) => {
  const { data } = await supabase.from("users").select("*");
  res.json(data);
});

app.post("/admin/changeBalance", async (req, res) => {
  const { username, amount } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (!user) return res.send("User not found");

  const newBalance = Math.max(0, (user.balance || 0) + amount);

  await supabase
    .from("users")
    .update({ balance: newBalance })
    .eq("username", username);

  res.send("Balance updated");
});

app.post("/admin/deleteUser", async (req, res) => {
  const { username } = req.body;

  await supabase
    .from("users")
    .delete()
    .eq("username", username);

  res.send("User deleted");
});

app.post("/admin/toggleBan", async (req, res) => {
  const { username } = req.body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (!user) return res.send("User not found");

  await supabase
    .from("users")
    .update({ banned: !user.banned })
    .eq("username", username);

  res.send(user.banned ? "User unbanned" : "User banned");
});
/* ================= START ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});