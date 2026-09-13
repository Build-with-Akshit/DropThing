const cron = require('node-cron');
const db = require('../config/db');
const { deleteFile } = require('./storageService');

const runCleanup = async () => {
  try {
    // Find all expired temporary folders
    const nowIso = new Date().toISOString();
    const expiredFolders = await db.prepare(`
      SELECT id, code, name FROM folders 
      WHERE is_temporary = 1 AND expires_at IS NOT NULL AND expires_at <= ?
    `).all(nowIso);

    if (!expiredFolders || expiredFolders.length === 0) {
      return 0;
    }

    console.log(`[Auto-Cleanup] Found ${expiredFolders.length} expired folder(s). Cleaning up...`);

    let totalFilesDeleted = 0;

    for (const folder of expiredFolders) {
      // Get all stored files in this folder to delete from storage (Cloudflare R2 or local disk)
      const files = await db.prepare(`
        SELECT stored_name FROM items 
        WHERE folder_id = ? AND item_type = 'file' AND stored_name IS NOT NULL
      `).all(folder.id);

      for (const file of files) {
        await deleteFile(file.stored_name);
        totalFilesDeleted++;
      }

      // Delete folder (Foreign Key cascade deletes item records)
      await db.prepare('DELETE FROM folders WHERE id = ?').run(folder.id);
      console.log(`[Auto-Cleanup] Purged folder: ${folder.name} (PIN: ${folder.code})`);
    }

    console.log(`[Auto-Cleanup] Finished. Deleted ${expiredFolders.length} folders and ${totalFilesDeleted} files.`);
    return expiredFolders.length;
  } catch (err) {
    console.error('[Auto-Cleanup Error]:', err.message);
    return 0;
  }
};

const startCleanupJob = () => {
  // Run once on server boot
  runCleanup().catch(err => console.error('[Initial Cleanup Error]:', err));

  // Run every 10 minutes (*/10 * * * *)
  cron.schedule('*/10 * * * *', () => {
    runCleanup().catch(err => console.error('[Periodic Cleanup Error]:', err));
  });
  console.log('[Auto-Cleanup] 24-Hour Expiration Cron scheduled (every 10 minutes).');
};

module.exports = {
  runCleanup,
  startCleanupJob
};
