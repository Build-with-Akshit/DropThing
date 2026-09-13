const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const folderController = require('../controllers/folderController');
const itemController = require('../controllers/itemController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { upload } = require('../services/storageService');

const { checkPinRateLimit } = require('../middleware/rateLimiter');

// ==================== AUTH ROUTES ====================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', requireAuth, authController.getMe);
router.put('/auth/profile', requireAuth, authController.updateProfile);
router.put('/auth/password', requireAuth, authController.changePassword);

// ==================== FOLDER ROUTES ====================
// Quick drop (Guest or Account holders)
router.post('/folders/quick-drop', optionalAuth, folderController.createQuickDrop);

// Permanent folders (Account holders)
router.post('/folders/permanent', requireAuth, folderController.createPermanentFolder);
router.get('/folders/my-folders', requireAuth, folderController.getUserFolders);
router.delete('/folders/:id', optionalAuth, folderController.deleteFolder);

// Lookup folder by 4-digit PIN code (with rate limiter)
router.get('/folders/code/:code', checkPinRateLimit, optionalAuth, folderController.getFolderByCode);

// ==================== ITEM ROUTES ====================
// Add text note / long link
router.post('/items/text', itemController.addText);

// Upload files (up to 20 files at once, any extension)
router.post('/items/upload', upload.array('files', 20), itemController.uploadFiles);

// Download file stream
router.get('/items/download/:id', itemController.downloadFile);

// View / Preview file inline (images, media, pdf)
router.get('/items/view/:id', itemController.viewFile);

// Delete single item
router.delete('/items/:id', itemController.deleteItem);

// ==================== CRON / HEALTH ROUTES ====================
const { runCleanup } = require('../services/cleanupService');

// External Cron Trigger (e.g. cron-job.org, EasyCron, GitHub Actions, Vercel Cron)
// Hitting this endpoint also acts as a free keep-alive ping for Render free tier!
router.all('/cron/cleanup', async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['authorization'] || req.query.secret;
    if (authHeader !== `Bearer ${cronSecret}` && authHeader !== cronSecret) {
      return res.status(401).json({ error: 'Unauthorized: Invalid cron secret' });
    }
  }

  try {
    const result = await runCleanup();
    return res.json({
      success: true,
      message: `Cleaned up ${result.foldersDeleted} expired folder(s) and ${result.filesDeleted} file(s).`,
      foldersDeleted: result.foldersDeleted,
      filesDeleted: result.filesDeleted,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ error: 'Cleanup failed: ' + err.message });
  }
});

module.exports = router;
