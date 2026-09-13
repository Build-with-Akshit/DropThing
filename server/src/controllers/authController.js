const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);
  const userId = uuidv4();

  await db.prepare(`
    INSERT INTO users (id, name, email, password_hash)
    VALUES (?, ?, ?, ?)
  `).run(userId, name.trim(), email.toLowerCase().trim(), password_hash);

  const token = jwt.sign({ id: userId, email: email.toLowerCase().trim(), name: name.trim() }, JWT_SECRET, { expiresIn: '30d' });

  return res.status(201).json({
    message: 'Account created successfully!',
    token,
    user: { id: userId, name: name.trim(), email: email.toLowerCase().trim() }
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });

  return res.json({
    message: 'Logged in successfully!',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
};

const getMe = async (req, res) => {
  const user = await db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.json({ user });
};

module.exports = {
  register,
  login,
  getMe
};
