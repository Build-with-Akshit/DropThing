const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Check if Cloud Storage (Cloudflare R2 or Supabase S3) is enabled
const s3Endpoint = process.env.S3_ENDPOINT || 
  (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : null);

const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
const s3BucketName = process.env.S3_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'dropthing-files';
const s3Region = process.env.S3_REGION || 'auto';

const isCloud = process.env.STORAGE_PROVIDER === 's3' || 
  process.env.STORAGE_PROVIDER === 'r2' || 
  (!!s3Endpoint && !!s3AccessKeyId && !!s3SecretAccessKey);

let s3Client = null;
if (isCloud) {
  const { S3Client } = require('@aws-sdk/client-s3');
  s3Client = new S3Client({
    region: s3Region,
    endpoint: s3Endpoint,
    credentials: {
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretAccessKey
    },
    forcePathStyle: true // Ensures compatibility with Supabase S3, MinIO, and R2
  });
  console.log(`☁️ Cloud Object Storage activated (Bucket: ${s3BucketName}, Endpoint: ${s3Endpoint})`);
} else {
  console.log('📂 Local Disk Storage activated (server/uploads)');
}

// Multer Storage Configuration
// Using disk storage first ensures large file streams (e.g. 500MB videos/ISOs) never exhaust RAM
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1 GB max limit per file
});

/**
 * Sync uploaded file to Cloud Object Storage (Supabase S3 or Cloudflare R2) if enabled
 */
const uploadFileToStorage = async (file) => {
  if (!isCloud) {
    return {
      stored_name: file.filename,
      is_cloud: false
    };
  }

  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const filePath = path.join(uploadDir, file.filename);
  const fileStream = fs.createReadStream(filePath);

  const command = new PutObjectCommand({
    Bucket: s3BucketName,
    Key: file.filename,
    Body: fileStream,
    ContentType: file.mimetype || 'application/octet-stream'
  });

  await s3Client.send(command);

  // Remove temporary local file once pushed to cloud
  try {
    fs.unlinkSync(filePath);
  } catch {}

  return {
    stored_name: file.filename,
    is_cloud: true
  };
};

/**
 * Retrieve file stream for download or inline preview
 */
const getFileStream = async (storedName) => {
  if (isCloud) {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const command = new GetObjectCommand({
      Bucket: s3BucketName,
      Key: storedName
    });

    const response = await s3Client.send(command);
    return {
      isCloud: true,
      stream: response.Body,
      contentLength: response.ContentLength,
      contentType: response.ContentType
    };
  }

  // Local storage
  const filePath = path.join(uploadDir, storedName);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return {
    isCloud: false,
    filePath,
    stream: fs.createReadStream(filePath)
  };
};

/**
 * Delete file from Cloud Storage and/or local disk
 */
const deleteFile = async (storedName) => {
  if (!storedName) return;

  if (isCloud) {
    try {
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const command = new DeleteObjectCommand({
        Bucket: s3BucketName,
        Key: storedName
      });
      await s3Client.send(command);
    } catch (err) {
      console.error('Failed to delete file from Cloud Storage:', storedName, err.message);
    }
  }

  // Also clean up local file if present
  try {
    const localPath = path.join(uploadDir, storedName);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch (err) {
    console.error('Failed to delete file from local disk:', storedName, err.message);
  }
};

const getFilePath = (storedName) => {
  return path.join(uploadDir, storedName);
};

// Categorize files for Drive-style tabs
const categorizeFile = (filename, mimeType = '') => {
  const ext = path.extname(filename).toLowerCase();
  
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const videoExts = ['.mp4', '.mkv', '.mov', '.avi', '.webm', '.flv', '.3gp', '.wmv'];
  const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf', '.odt', '.json', '.md'];
  
  if (imageExts.includes(ext) || mimeType.startsWith('image/')) {
    return 'image';
  }
  if (videoExts.includes(ext) || mimeType.startsWith('video/')) {
    return 'video';
  }
  if (docExts.includes(ext) || mimeType.includes('pdf') || mimeType.includes('officedocument') || mimeType.includes('text/')) {
    return 'document';
  }
  return 'other'; // .zip, .exe, .apk, etc.
};

module.exports = {
  upload,
  uploadFileToStorage,
  getFileStream,
  getFilePath,
  deleteFile,
  categorizeFile,
  uploadDir,
  isCloudStorage: isCloud
};
