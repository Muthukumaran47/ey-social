const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
const SECRET_KEY = "mysecretkey";

// middleware
app.use(express.json());
app.use(cors());

// ---------------- FILE HELPERS ----------------

// read JSON file
const readData = (file) => {
  const data = fs.readFileSync(file);
  return JSON.parse(data);
};

// write JSON file
const writeData = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// ---------------- AUTH MIDDLEWARE ----------------

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: "Token required" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// ---------------- ROUTES ----------------

// test
app.get('/', (req, res) => {
  res.send("API Running 🚀");
});

// ---------------- SIGNUP ----------------

app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  let users = readData('users.json');

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password
  };

  users.push(newUser);
  writeData('users.json', users);

  res.status(201).json({ message: "Signup successful" });
});

// ---------------- LOGIN ----------------

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  let users = readData('users.json');

  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.password !== password) {
    return res.status(401).json({ message: "Invalid password" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  res.json({ message: "Login successful", token });
});

// ---------------- CREATE POST ----------------

app.post('/posts', authenticate, (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "Content required" });
  }

  let posts = readData('posts.json');

  const newPost = {
    id: posts.length + 1,
    content,
    userId: req.user.id,
    userEmail: req.user.email,
    username: req.user.name,
    likes: []
  };

  posts.push(newPost);
  writeData('posts.json', posts);

  res.status(201).json({ message: "Post created", post: newPost });
});

// ---------------- GET POSTS ----------------

app.get('/posts', authenticate, (req, res) => {
  let posts = readData('posts.json');
  res.json({ posts });
});

// ---------------- LIKE POST ----------------

app.post('/posts/:id/like', authenticate, (req, res) => {
  let posts = readData('posts.json');

  const post = posts.find(p => p.id === parseInt(req.params.id));

  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (post.likes.includes(req.user.id)) {
    return res.status(400).json({ message: "Already liked" });
  }

  post.likes.push(req.user.id);

  writeData('posts.json', posts);

  res.json({ message: "Post liked", post });
});

// ---------------- DELETE POST ----------------

app.delete('/posts/:id', authenticate, (req, res) => {
  let posts = readData('posts.json');

  const index = posts.findIndex(p => p.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (posts[index].userId !== req.user.id) {
    return res.status(403).json({ message: "Not allowed" });
  }

  posts.splice(index, 1);

  writeData('posts.json', posts);

  res.json({ message: "Post deleted" });
});

app.delete("/clear-posts", (req, res) => {
  const fs = require("fs");
  fs.writeFileSync("posts.json", JSON.stringify([]));
  res.json({ message: "All posts deleted" });
});


// ---------------- START SERVER ----------------

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
