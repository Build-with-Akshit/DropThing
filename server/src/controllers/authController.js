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
  try {
    const user = await db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get count of permanent folders and total storage for this user
    const stats = await db.prepare(`
      SELECT 
        COUNT(DISTINCT f.id) AS folder_count,
        COALESCE(SUM(i.file_size), 0) AS total_storage
      FROM folders f
      LEFT JOIN items i ON f.id = i.folder_id
      WHERE f.user_id = ?
    `).get(req.user.id);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        folder_count: Number(stats?.folder_count || 0),
        total_storage: Number(stats?.total_storage || 0)
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user data: ' + err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters long.' });
    }

    await db.prepare('UPDATE users SET name = ? WHERE id = ?').run(trimmedName, req.user.id);

    const user = await db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.user.id);

    // Issue updated token with new name
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({
      message: 'Profile updated successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newPasswordHash = bcrypt.hashSync(newPassword, salt);

    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, req.user.id);

    return res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to change password: ' + err.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};

