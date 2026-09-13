const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { 
  uploadFileToStorage, 
  getFileStream, 
  deleteFile, 
  categorizeFile 
} = require('../services/storageService');

// 1. Add Text / Long Snippet / URL
const addText = async (req, res) => {
  try {
    const { folderId, title, textContent } = req.body;

    if (!folderId || !textContent || !textContent.trim()) {
      return res.status(400).json({ error: 'Folder ID and text content are required.' });
    }

    const folder = await db.prepare('SELECT id FROM folders WHERE id = ?').get(folderId);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found.' });
    }

    const itemId = uuidv4();
    const itemTitle = title?.trim() || (textContent.trim().slice(0, 40) + (textContent.trim().length > 40 ? '...' : ''));

    await db.prepare(`
      INSERT INTO items (id, folder_id, item_type, title, text_content, category)
      VALUES (?, ?, 'text', ?, ?, 'text')
    `).run(itemId, folderId, itemTitle, textContent.trim());

    const item = await db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
    return res.status(201).json({ message: 'Text added successfully!', item });
  } catch (err) {
    console.error('Error adding text:', err);
    return res.status(500).json({ error: 'Failed to add text.' });
  }
};

// 2. Upload File(s) - Accepts ANY file type (.pdf, .docx, .zip, .exe, .apk, etc.)
const uploadFiles = async (req, res) => {
  try {
    const { folderId } = req.body;
    if (!folderId) {
      return res.status(400).json({ error: 'Folder ID is required.' });
    }

    const folder = await db.prepare('SELECT id FROM folders WHERE id = ?').get(folderId);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const uploadedItems = [];
    const insertStmt = db.prepare(`
      INSERT INTO items (id, folder_id, item_type, title, file_name, stored_name, file_size, mime_type, category)
      VALUES (?, ?, 'file', ?, ?, ?, ?, ?, ?)
    `);

    const uploadTasks = req.files.map(async (file) => {
      const itemId = uuidv4();
      const category = categorizeFile(file.originalname, file.mimetype);
      const storageResult = await uploadFileToStorage(file);
      return {
        itemId,
        file,
        category,
        stored_name: storageResult.stored_name
      };
    });

    const processedFiles = await Promise.all(uploadTasks);

    for (const item of processedFiles) {
      await insertStmt.run(
        item.itemId,
        folderId,
        item.file.originalname,
        item.file.originalname,
        item.stored_name,
        item.file.size,
        item.file.mimetype,
        item.category
      );

      const nowIso = new Date().toISOString();
      uploadedItems.push({
        id: item.itemId,
        folder_id: folderId,
        item_type: 'file',
        title: item.file.originalname,
        file_name: item.file.originalname,
        file_size: item.file.size,
        mime_type: item.file.mimetype,
        category: item.category,
        created_at: nowIso
      });
    }

    return res.status(201).json({
      message: `${uploadedItems.length} file(s) uploaded successfully!`,
      items: uploadedItems
    });
  } catch (err) {
    console.error('Error uploading files:', err);
    return res.status(500).json({ error: 'Failed to upload files.' });
  }
};

// 3. Download File Stream (Local or Cloudflare R2)
const downloadFile = async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await db.prepare("SELECT * FROM items WHERE id = ? AND item_type = 'file'").get(itemId);

    if (!item || !item.stored_name) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const fileData = await getFileStream(item.stored_name);
    if (!fileData) {
      return res.status(404).json({ error: 'File data missing from storage.' });
    }

    // Headers for clean direct attachment download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(item.file_name)}"`);
    if (item.mime_type) {
      res.setHeader('Content-Type', item.mime_type);
    }
    if (item.file_size) {
      res.setHeader('Content-Length', item.file_size);
    }

    if (fileData.isCloud) {
      fileData.stream.pipe(res);
    } else {
      return res.download(fileData.filePath, item.file_name);
    }
  } catch (err) {
    console.error('Error downloading file:', err);
    return res.status(500).json({ error: 'Failed to download file.' });
  }
};

// 4. Delete Single Item
const deleteItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);

    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (item.item_type === 'file' && item.stored_name) {
      await deleteFile(item.stored_name);
    }

    await db.prepare('DELETE FROM items WHERE id = ?').run(itemId);
    return res.json({ message: 'Item deleted successfully.' });
  } catch (err) {
    console.error('Error deleting item:', err);
    return res.status(500).json({ error: 'Failed to delete item.' });
  }
};

// 5. View / Inline Stream File (For Images, PDFs, MD, and Media Previews)
const viewFile = async (req, res) => {
  try {
    const itemId = req.params.id;
    const item = await db.prepare("SELECT * FROM items WHERE id = ? AND item_type = 'file'").get(itemId);

    if (!item || !item.stored_name) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const fileData = await getFileStream(item.stored_name);
    if (!fileData) {
      return res.status(404).json({ error: 'File data missing from storage.' });
    }

    // Set inline disposition so browsers render images/videos/text/pdf instead of forcing download
    const ext = path.extname(item.file_name || '').toLowerCase();
    const mimeMap = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain; charset=utf-8',
      '.md': 'text/plain; charset=utf-8',
      '.csv': 'text/plain; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.js': 'text/plain; charset=utf-8',
      '.jsx': 'text/plain; charset=utf-8',
      '.ts': 'text/plain; charset=utf-8',
      '.tsx': 'text/plain; charset=utf-8',
      '.py': 'text/plain; charset=utf-8',
      '.html': 'text/plain; charset=utf-8',
      '.css': 'text/plain; charset=utf-8',
      '.xml': 'text/plain; charset=utf-8',
      '.log': 'text/plain; charset=utf-8',
      '.sql': 'text/plain; charset=utf-8',
      '.sh': 'text/plain; charset=utf-8',
      '.bat': 'text/plain; charset=utf-8',
      '.env': 'text/plain; charset=utf-8',
      '.yaml': 'text/plain; charset=utf-8',
      '.yml': 'text/plain; charset=utf-8'
    };

    const contentType = mimeMap[ext] || item.mime_type || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(item.file_name)}"`);
    if (item.file_size) {
      res.setHeader('Content-Length', item.file_size);
    }

    if (fileData.isCloud) {
      fileData.stream.pipe(res);
    } else {
      return res.sendFile(fileData.filePath);
    }
  } catch (err) {
    console.error('Error viewing file:', err);
    return res.status(500).json({ error: 'Failed to view file.' });
  }
};

module.exports = {
  addText,
  uploadFiles,
  downloadFile,
  viewFile,
  deleteItem
};
