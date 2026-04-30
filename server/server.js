const { createClient } = require('@supabase/supabase-js');
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const supabase = createClient(
  "https://ehrwgafswlrnadsjqiwt.supabase.co",
  "YOUR_SUPABASE_ANON_KEY"
);

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