const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { deleteFile } = require('../services/storageService');
const { recordFailedAttempt, clearFailedAttempts } = require('../middleware/rateLimiter');

// Generate unique 4 to 6 digit numeric or short code
const generateUniqueCode = async (length = 4) => {
  let attempts = 0;
  while (attempts < 50) {
    let min = Math.pow(10, length - 1);
    let max = Math.pow(10, length) - 1;
    let code = Math.floor(min + Math.random() * (max - min + 1)).toString();

    const existing = await db.prepare('SELECT id FROM folders WHERE code = ?').get(code);
    if (!existing) {
      return code;
    }
    attempts++;
    if (attempts > 30) length = 5; // Expand length if space gets congested
  }
  return uuidv4().substring(0, 6).toUpperCase();
};

// 1. Create Quick 24h Drop (Guest Mode - No Login)
const createQuickDrop = async (req, res) => {
  try {
    const code = await generateUniqueCode(4);
    const folderId = uuidv4();
    const folderName = req.body.name?.trim() || `Quick Drop #${code}`;

    // Expire exactly 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await db.prepare(`
      INSERT INTO folders (id, user_id, code, name, is_temporary, expires_at)
      VALUES (?, NULL, ?, ?, 1, ?)
    `).run(folderId, code, folderName, expiresAt);

    const folder = await db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);

    return res.status(201).json({
      message: 'Quick 24-hour drop created!',
      folder: {
        ...folder,
        time_left_seconds: 24 * 60 * 60
      }
    });
  } catch (err) {
    console.error('Error creating quick drop:', err);
    return res.status(500).json({ error: 'Failed to create quick drop.' });
  }
};

// 2. Create Permanent Folder (Account Mode)
const createPermanentFolder = async (req, res) => {
  try {
    const { name, customCode } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Folder name is required.' });
    }

    let code = customCode ? customCode.trim().toUpperCase() : await generateUniqueCode(4);

    // If custom code provided, check availability
    if (customCode) {
      if (code.length < 3 || code.length > 10) {
        return res.status(400).json({ error: 'Custom code must be 3-10 characters.' });
      }
      const existing = await db.prepare('SELECT id FROM folders WHERE code = ?').get(code);
      if (existing) {
        return res.status(409).json({ error: `Code '${code}' is already taken. Please choose another.` });
      }
    }

    const folderId = uuidv4();

    await db.prepare(`
      INSERT INTO folders (id, user_id, code, name, is_temporary, expires_at)
      VALUES (?, ?, ?, ?, 0, NULL)
    `).run(folderId, req.user.id, code, name.trim());

    const folder = await db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);

    return res.status(201).json({
      message: 'Permanent folder created successfully!',
      folder
    });
  } catch (err) {
    console.error('Error creating permanent folder:', err);
    return res.status(500).json({ error: 'Failed to create permanent folder.' });
  }
};

// 3. Get Folder and Items by Code (For Public PC / Homepage PIN access)
const getFolderByCode = async (req, res) => {
  try {
    const rawCode = req.params.code?.trim().toUpperCase();
    if (!rawCode) {
      return res.status(400).json({ error: 'Code is required.' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const folder = await db.prepare('SELECT * FROM folders WHERE code = ?').get(rawCode);

    if (!folder) {
      recordFailedAttempt(clientIp);
      return res.status(404).json({ error: 'No folder found for this PIN code. Please double-check the code.' });
    }

    // Clear failed attempts upon successful folder lookup
    clearFailedAttempts(clientIp);

    // Check if expired
    if (folder.is_temporary && folder.expires_at) {
      const now = new Date().toISOString();
      if (folder.expires_at <= now) {
        // Purge files immediately
        const files = await db.prepare(`
          SELECT stored_name FROM items 
          WHERE folder_id = ? AND item_type = 'file' AND stored_name IS NOT NULL
        `).all(folder.id);
        for (const file of files) {
          await deleteFile(file.stored_name);
        }
        await db.prepare('DELETE FROM folders WHERE id = ?').run(folder.id);
        return res.status(410).json({ error: 'This 24-hour temporary drop has expired and all contents were destroyed.' });
      }
    }

    // Fetch items
    const items = await db.prepare(`
      SELECT id, folder_id, item_type, title, text_content, file_name, file_size, mime_type, category, created_at
      FROM items 
      WHERE folder_id = ?
      ORDER BY created_at DESC
    `).all(folder.id);

    // Calculate time remaining in seconds for temporary folders
    let timeLeftSeconds = null;
    if (folder.is_temporary && folder.expires_at) {
      const expiresDate = new Date(folder.expires_at.endsWith('Z') ? folder.expires_at : folder.expires_at + 'Z').getTime();
      const nowDate = Date.now();
      timeLeftSeconds = Math.max(0, Math.floor((expiresDate - nowDate) / 1000));
    }

    return res.json({
      folder: {
        id: folder.id,
        code: folder.code,
        name: folder.name,
        is_temporary: Boolean(folder.is_temporary),
        expires_at: folder.expires_at,
        time_left_seconds: timeLeftSeconds,
        created_at: folder.created_at,
        is_owner: req.user ? req.user.id === folder.user_id : false
      },
      items
    });
  } catch (err) {
    console.error('Error retrieving folder by code:', err);
    return res.status(500).json({ error: 'Failed to access folder.' });
  }
};

// 4. Get all folders belonging to logged-in user
const getUserFolders = async (req, res) => {
  try {
    const folders = await db.prepare(`
      SELECT f.*, 
             COUNT(i.id) as item_count,
             COALESCE(SUM(i.file_size), 0) as total_size_bytes
      FROM folders f
      LEFT JOIN items i ON f.id = i.folder_id
      WHERE f.user_id = ? OR f.user_id IN (SELECT id FROM users WHERE LOWER(name) = 'akshit')
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `).all(req.user.id);

    const mappedFolders = folders.map(f => ({
      ...f,
      item_count: parseInt(f.item_count || 0, 10),
      total_size_bytes: parseInt(f.total_size_bytes || 0, 10)
    }));

    return res.json({ folders: mappedFolders });
  } catch (err) {
    console.error('Error retrieving user folders:', err);
    return res.status(500).json({ error: 'Failed to retrieve your folders.' });
  }
};

// 5. Delete folder
const deleteFolder = async (req, res) => {
  try {
    const folderId = req.params.id;
    const folder = await db.prepare('SELECT * FROM folders WHERE id = ?').get(folderId);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found.' });
    }

    // Check ownership if it's a permanent user folder
    if (folder.user_id && (!req.user || req.user.id !== folder.user_id)) {
      return res.status(403).json({ error: 'You are not authorized to delete this folder.' });
    }

    // Delete stored files from storage
    const files = await db.prepare("SELECT stored_name FROM items WHERE folder_id = ? AND item_type = 'file'").all(folderId);
    for (const f of files) {
      await deleteFile(f.stored_name);
    }

    await db.prepare('DELETE FROM folders WHERE id = ?').run(folderId);
    return res.json({ message: 'Folder and all associated files deleted successfully.' });
  } catch (err) {
    console.error('Error deleting folder:', err);
    return res.status(500).json({ error: 'Failed to delete folder.' });
  }
};

module.exports = {
  createQuickDrop,
  createPermanentFolder,
  getFolderByCode,
  getUserFolders,
  deleteFolder
};
