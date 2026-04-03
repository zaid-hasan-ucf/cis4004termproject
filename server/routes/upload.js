const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../../data/uploads/avatars');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${req.callerId}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.post('/avatar', (req, res, next) => {
  if (!req.callerId) return res.status(401).json({ error: 'Authentication required' });
  next();
}, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No valid image provided (max 2 MB, JPEG/PNG/WebP/GIF)' });
  }
  const origin = process.env.SERVER_ORIGIN || 'http://localhost:5000';
  res.json({ url: `${origin}/uploads/avatars/${req.file.filename}` });
});

module.exports = router;
