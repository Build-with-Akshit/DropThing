# ⚡ DropThing — Instant PIN-Based Cloud File & Text Bridge

<div align="center">

![DropThing Logo](https://img.shields.io/badge/DropThing-Cloud%20Bridge-6366f1?style=for-the-badge&logo=icloud&logoColor=white)
[![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Supabase](https://img.shields.io/badge/Supabase%20S3-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Send text, links, documents, photos, and files between any phone and public PC with just a 4-digit code.**  
*Zero login required. Zero traces left behind.*

[Live Demo](https://dropthing.vercel.app)
</div>

---

## 💡 Why DropThing?

Transferring files or links between your phone and a shared computer (college lab, library PC, print shop, cyber café) usually forces you to log into WhatsApp Web, Telegram, Google Drive, or personal email. **This leaves your personal accounts vulnerable to session hijacking, cached credentials, and keystroke loggers.**

**DropThing solves this completely:**
1. **Open on Phone** $\rightarrow$ Tap **"Create 24h Quick Drop"** to get a 4-digit PIN (e.g. `4829`).
2. **Drop Content** $\rightarrow$ Paste your links, long notes, or upload any file (`.pdf`, `.zip`, `.png`, `.mp4`).
3. **Open on Public PC** $\rightarrow$ Open DropThing in Incognito, enter the 4-digit code, and 1-click download or copy.
4. **Close Tab** $\rightarrow$ No accounts to sign out of, zero cookies saved. The temporary locker self-destructs after 24 hours.

---

## 🌟 Key Features

### ⚡ 1. Quick 24h Drop (Guest Mode)
- **Zero Registration**: Instant generation of temporary 4-digit PIN lockers without an account.
- **Auto-Destruction**: Lockers and their associated uploads automatically delete after 24 hours.
- **Live Countdown**: Real-time timer badge (`⏳ 23h 58m left`) displayed inside the locker.

### 👤 2. Permanent Cloud Drive (Account Mode)
- **Lifetime Storage**: Register or log in to keep your folders and files permanently.
- **Custom Vanity PINs**: Create folders with memorable custom codes (e.g. `VAULT1`, `WORK24`).
- **Drive Dashboard**: Manage all your active 24h drops and permanent folders in one place with responsive filter tabs (`All`, `Permanent`, `24h Drops`) and quick search.
- **Account & Security Settings**: Real-time storage stats (`Permanent Folders`, `Storage Used`), name customization, and secure password updates.

### 📂 3. Dedicated Action Uploads & Pastel Accents
Inside any locker, uploads are organized with dedicated, color-accented action cards:
- 📝 **`+ Text / Link` (Cyan Tint)**: Auto-focused modal with 1-click clipboard paste and `Ctrl + Enter` fast-save.
- 🖼️ **`+ Photo` (Pink Tint)**: Image upload with inline image thumbnails and full-resolution lightbox modal.
- 🎥 **`+ Videos` (Crimson / Rose Tint)**: Video upload with live frame thumbnail generator and built-in video player.
- 📦 **`+ Any File` (Amber Tint)**: Universal file upload support for `.pdf`, `.docx`, `.zip`, `.exe`, `.apk`, etc.
- 🚀 **Full Drag & Drop**: Drag files anywhere over the screen to trigger automatic multi-file uploads.

### 👁️ 4. Rich In-Browser Previews
- **PDF Viewer**: Embedded responsive PDF viewer for reviewing documents before downloading.
- **Code & Text Reader**: Monospaced code modal with 1-click "Copy All Text" for `.txt`, `.py`, `.js`, `.json`, `.csv`, `.md`, `.html`.
- **Media Lightbox**: Crisp, edge-to-edge modal for full-size images and playable video files.

### 🔄 5. Live Auto-Sync & QR Sharing
- **Real-Time Polling**: 5-second background sync ensures uploads from mobile appear on the PC screen instantly without page refresh.
- **QR Code Modal**: Scan directly with your phone's default camera to jump straight into any locker.

### 📱 6. Mobile-First & Context-Aware Navigation
- **Adaptive Logo / Home Button**: Shows full DropThing branding on the Home page, and a quick `<Home />` icon inside subviews (`locker` and `dashboard`).
- **Unified Profile Pill**: `[ 👤 Name ⚙ ]` button seamlessly accessible on both mobile and desktop.
- **Browser History Integration**: Full support for back/forward navigation (`Alt + Left` / `Alt + Right`) without breaking locker states.
- **Dark & Light Mode**: Smooth theme toggle with instant `localStorage` persistence.

---

## 🏗️ Architecture & Tech Stack

```
   ┌─────────────────────────────────────────────────────────┐
   │                   DropThing Client                      │
   │  React 19 • Vite • Lucide Icons • Modern Vanilla CSS    │
   └───────────────┬─────────────────────────▲───────────────┘
                   │ HTTP / REST             │ Live 5s Polling
                   ▼                         │
   ┌─────────────────────────────────────────┴───────────────┐
   │                   Express API Engine                    │
   │  JWT Auth • Multer Storage • Auto-Destruct Cron Worker  │
   └───────────────┬─────────────────────────┬───────────────┘
                   │                         │
      Database Adapter             Storage Adapter
                   ▼                         ▼
   ┌─────────────────────────┐   ┌───────────────────────────┐
   │  Turso / Supabase /     │   │  Supabase S3 / Cloudflare │
   │  Local SQLite DB        │   │  R2 / Local Disk Storage  │
   └─────────────────────────┘   └───────────────────────────┘
```

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 19, Vite | Fast, responsive single-page application |
| **Icons & Styling**| Lucide React, Custom CSS | Modern glassmorphism, responsive grid, zero heavy UI frameworks |
| **Backend** | Node.js, Express 4 | Modular REST API with auto-destruct cleanup worker |
| **Database** | SQLite (`better-sqlite3`) / Supabase / Turso | Local file storage or zero-latency cloud database |
| **File Storage**| Supabase S3 / Cloudflare R2 / Local Disk | Flexible multi-provider storage adapter |
| **Auth** | JSON Web Tokens (JWT), bcryptjs | Stateless, secure authentication for Permanent Drive |

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/Build-with-Akshit/DropThing.git
cd DropThing
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables (Optional)
```bash
cd ../server
cp .env.example .env
```
*(By default, DropThing runs with zero external configuration using local SQLite and disk storage).*

### 4. Start Development Servers
Open two terminal windows:

**Terminal 1 (Backend - Port 5000):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend - Port 5173):**
```bash
cd client
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## ⚙️ Environment Configuration (`server/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Backend API port |
| `JWT_SECRET` | `dropthing-super-secret` | Secret key for JWT signing |
| `DATABASE_PROVIDER` | `local` | Database provider: `local`, `turso`, or `supabase` |
| `DATABASE_URL` | — | Connection string for Supabase PostgreSQL |
| `TURSO_DATABASE_URL` | — | `libsql://your-db.turso.io` (if using Turso) |
| `TURSO_AUTH_TOKEN` | — | Turso database authentication token |
| `STORAGE_PROVIDER` | `local` | File storage provider: `local`, `s3`, or `r2` |
| `S3_ENDPOINT` | — | S3-compatible endpoint (e.g. Supabase Storage S3) |
| `S3_REGION` | `ap-south-1` | S3 region |
| `S3_BUCKET_NAME` | `dropthing-files` | Target bucket name |
| `S3_ACCESS_KEY_ID` | — | S3 access key ID |
| `S3_SECRET_ACCESS_KEY` | — | S3 secret access key |
| `FRONTEND_URL` | — | Allowed CORS origin (e.g. `https://dropthing.vercel.app`) |

---

## 🌐 Free Cloud Deployment Guide

### 1. Storage: Supabase S3 (100% Free, No Credit Card)
1. Sign up on [supabase.com](https://supabase.com/) and create a project (e.g. `dropthing` in Mumbai `ap-south-1`).
2. Go to **Storage $\rightarrow$ Buckets** $\rightarrow$ Create bucket `dropthing-files` (Public: **ON**).
3. Go to **Project Settings $\rightarrow$ Storage $\rightarrow$ S3 Access Keys** and generate credentials.

### 2. Backend API: Render Web Service
1. Push your repository to GitHub.
2. Sign up on [render.com](https://render.com/) and create a new **Web Service**.
3. Configure settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `STORAGE_PROVIDER=s3`
   - `S3_ENDPOINT=https://<project-ref>.supabase.co/storage/v1/s3`
   - `S3_REGION=ap-south-1`
   - `S3_BUCKET_NAME=dropthing-files`
   - `S3_ACCESS_KEY_ID=<your-key>`
   - `S3_SECRET_ACCESS_KEY=<your-secret>`
   - `DATABASE_PROVIDER=local` *(or `turso` for persistent cloud DB)*
   - `JWT_SECRET=<random-32-char-string>`

### 3. Frontend: Vercel Global Edge CDN
1. Go to [vercel.com](https://vercel.com/) and click **Add New Project**.
2. Select the GitHub repository.
3. Configure settings:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
4. Add Environment Variable:
   - `VITE_API_URL=https://your-dropthing-api.onrender.com`
5. Click **Deploy**!

---

## ⏰ Automated Cron Job (24h File Expiration & Keep-Alive)

DropThing automatically destroys expired temporary lockers and their uploaded files after 24 hours. Because free hosting providers like Render spin down after 15 minutes of inactivity, you can configure an automated cron trigger using any of these methods:

### Option A: Free Cron-Job.org (Recommended — 1-Minute Setup)
1. Sign up on [cron-job.org](https://cron-job.org/) (100% Free).
2. Click **Create Cronjob**:
   - **Title**: `DropThing Cleanup & Keep-Alive`
   - **URL**: `https://your-dropthing-api.onrender.com/api/cron/cleanup`
   - **Schedule**: Every `10` or `14` minutes.
3. Save! This does two vital things:
   - ⚡ **Keeps your Render server awake 24/7** (zero cold-start delay).
   - 🗑️ **Cleans up expired 24h files & folders automatically**.

### Option B: GitHub Actions Workflow
If you prefer running cron jobs via GitHub, you can create `.github/workflows/cleanup-cron.yml` on GitHub:
```yaml
name: DropThing 24h Cleanup & Keep-Alive
on:
  schedule:
    - cron: '*/14 * * * *' # Every 14 minutes
  workflow_dispatch:
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Ping DropThing
        run: curl -s "https://your-dropthing-api.onrender.com/api/cron/cleanup"
```

### Option C: Internal Node-Cron (For VPS / Local / Paid Tiers)
If your server runs continuously without sleeping, the built-in `node-cron` worker in `server/src/services/cleanupService.js` runs automatically every 10 minutes (configurable via `CLEANUP_CRON_SCHEDULE` in `.env`).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Context | Action |
|---|---|---|
| `Ctrl + Enter` / `Cmd + Enter` | Text / Link Modal | Immediately save and send note |
| `Ctrl + Shift + H` | Profile / Security Modal | Toggle password field visibility |
| `Escape` | Any Modal / Lightbox | Close active dialog |
| `Alt + Left Arrow` | Browser Navigation | Return to Previous View / Home |
| `Alt + Right Arrow` | Browser Navigation | Forward View Navigation |

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute for personal or commercial projects.

<div align="center">
Built with ❤️ by <a href="https://github.com/Build-with-Akshit">Akshit Gupta</a>
</div>
