const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { getUserFromSheets, logActionToSheets } = require('./sheet');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use(express.static('public'));

// Auth middleware
function checkAuth(req, res, next) {
  const user = req.cookies.user;
  const expires = parseInt(req.cookies.expires, 10);

  if (!user || !expires || Date.now() > expires) {
    res.clearCookie('user');
    res.clearCookie('expires');
    return res.redirect('/login.html');
  }

  req.user = JSON.parse(user);
  next();
}

// Login handler
app.post('/auth', async (req, res) => {
  const { username, password } = req.body;
  const user = await getUserFromSheets(username, password);

  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  // Set 15-minute cookie
  const expires = Date.now() + 15 * 60 * 1000;
  res.cookie('user', JSON.stringify(user), { httpOnly: true });
  res.cookie('expires', expires.toString(), { httpOnly: true });

  res.sendStatus(200);
});

// Logout handler
app.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.clearCookie('expires');
  res.redirect('/login.html');
});

// Dashboard route
app.get('/dashboard', checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Action route
app.post('/action', checkAuth, async (req, res) => {
  const { action, target, reason, evidence } = req.body;
  const user = req.user;

  if (!target || !reason || !evidence || evidence.length !== 3) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const allowed = {
    1: ['warn'],
    2: ['warn', 'kick'],
    3: ['warn', 'kick', 'ban'],
  };

  const permitted = allowed[user.permissionLevel] || [];

  if (!permitted.includes(action)) {
    return res.status(403).json({ message: 'Permission denied' });
  }

  await logActionToSheets(action, user.username, target, reason, evidence);
  res.json({ message: 'Action logged' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
