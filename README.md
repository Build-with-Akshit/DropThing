# ⚡ DropThing — Instant PIN-Based Cloud File & Text Bridge

> **Zero-Login File & Text Sharing:** Seamlessly transfer massive texts, long links, documents, photos, videos, and arbitrary files between mobile and public/library PCs without logging in, without typing complex URLs, and leaving zero traces behind after closing the incognito window.

---

## 🌟 Key Features

1. **⚡ Quick 24h Drop (Guest Mode - Mobile & Incognito Friendly)**
   - No registration or login required.
   - Click **"Create 24h Quick Drop"** to instantly generate a 4-digit PIN (e.g. `4829`).
   - Automatically **destructs and deletes all files and database records after 24 hours**.
   - Dynamic countdown timer (`⏳ 23h 58m left`) displayed inside the locker.

2. **🖥️ Public / Library PC Experience (Zero Traces)**
   - Open DropThing on any PC in Incognito mode.
   - Type the 4-digit PIN into the auto-advancing PIN input.
   - Folder opens immediately!
   - 1-Click **"Copy to Clipboard"** for long texts and links.
   - 1-Click **"Download"** for files.
   - Close the browser tab — zero history, cookies, or account credentials saved.

3. **👤 Permanent Cloud Drive (Account Mode)**
   - Register or log in to get **Lifetime / Permanent Storage**.
   - Create unlimited folders with custom codes (e.g. `VAULT1`) or auto-generated PINs.
   - Folders and files in account mode never expire.

4. **📂 Dedicated Action Uploads & Full Previews**
   - 📝 **`+ Text / Link`**: Auto-focused textarea with `Ctrl + Enter` shortcut and 1-click clipboard paste.
   - 🖼️ **`+ Photo`**: Image upload with inline thumbnails and full-resolution lightbox viewer.
   - 🎥 **`+ Videos`**: Video upload with live video frame preview, hover preview, and built-in video player.
   - 📦 **`+ Any File`**: Universal file upload (`.pdf`, `.docx`, `.zip`, `.exe`, `.apk`, etc.).
   - 📄 **Universal Text & Code Previews**: Inline monospaced snippets and modal reader with 1-click text copy for `.md`, `.txt`, `.py`, `.js`, `.json`, `.csv`, `.html`, etc.
   - 📑 **Interactive PDF Viewer**: Embedded PDF reader in modal.
   - 🚀 **Full Drag & Drop**: Drag files anywhere over the browser window to upload.

5. **🔄 Live Sync & QR Code**
   - Auto-polling keeps locker updated in real-time. Files uploaded from mobile appear on the PC screen without refreshing!
   - **QR Code Modal**: Scan directly with a phone camera to jump straight into the locker.

6. **☀️ Light & Dark Themes**
   - Clean, modern light theme by default with 1-click dark mode toggle.

---

## ☁️ Production Cloud Architecture (100% Free)

DropThing features a **Universal Storage & Database Adapter**:
- **Cloud Storage**: Supabase S3 (1 GB Free, **Zero Credit Card Required**) or Cloudflare R2 (10 GB Free).
- **Cloud Database**: Turso (9 GB Free Cloud SQLite / libSQL) or local SQLite fallback.
- **Backend Hosting**: Render Web Service (Free with automatic SSL).
- **Frontend Hosting**: Vercel (Free Global Edge CDN with custom domain support).

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- npm

### 1. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment (Optional)
```bash
cd server
cp .env.example .env
```
*(If no cloud keys are provided, DropThing defaults to local SQLite and local disk storage automatically).*

### 3. Run Locally
```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 🌐 Free Cloud Deployment Guide

### 1. Cloud Storage (Supabase S3 - No Card Required)
1. Sign up on [supabase.com](https://supabase.com/) with GitHub.
2. Create project `dropthing` (Region: `ap-south-1` Mumbai).
3. Go to **Storage -> Files** -> Create bucket `DropThing-files` (Public: ON).
4. Go to **Project Settings -> Storage -> S3 Access Keys** -> Generate S3 Access Key.

### 2. Backend API on Render
1. Push this repository to GitHub.
2. Go to [render.com](https://render.com/) -> **New +** -> **Web Service**.
3. Select repo:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Set Environment Variables:
   - `STORAGE_PROVIDER=s3`
   - `S3_ENDPOINT=<your-supabase-s3-endpoint>`
   - `S3_REGION=ap-south-1`
   - `S3_BUCKET_NAME=DropThing-files`
   - `S3_ACCESS_KEY_ID=<your-access-key-id>`
   - `S3_SECRET_ACCESS_KEY=<your-secret-key>`
   - `DATABASE_PROVIDER=local` (or `turso`)
   - `JWT_SECRET=<random-secret-key>`

### 3. Frontend on Vercel
1. Go to [vercel.com](https://vercel.com/) -> **Add New...** -> **Project**.
2. Select repo:
   - Root Directory: `client`
   - Framework: Vite
3. Environment Variable:
   - `VITE_API_URL=https://your-app.onrender.com`
4. Click **Deploy**! Live at `https://your-app.vercel.app`.

---

## 📜 License
MIT &copy; 2026 DropThing
