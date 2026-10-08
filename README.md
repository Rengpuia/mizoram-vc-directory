# 🏛️ Mizoram VC Directory Suite - Deployment Package

Complete deployment bundle for the **Mizoram State & Kolasib District Village Council (VC) Phonebook, Administrative Management Portal & Real-Time Sync Backend**.

---

## 📦 Package Contents

* `backend/`: Node.js Express sync server, REST API, SSE push engine, and database store.
* `download/`: Citizen App Download Landing Page (`/download/`, `/download-app`, `/apk`) with QR code, direct APK download, and WhatsApp share buttons.
* `kolasib-vc-phonebook/www/`: Citizen Phonebook Web App (with responsive mobile UI, in-app dialogs, offline cache, and Mizo WhatsApp messaging).
* `kolasib-vc-admin/www/`: District Admin Web Portal (PIN authentication, live editor, audit trail, report resolution).
* `simulator/`: Side-by-side Dual Phone Live Simulator interface.
* `release_apks/`:
  * `Mizoram_VC_Phonebook.apk` (Signed Official Citizen App, 5.66 MB)
  * `Mizoram_VC_Admin.apk` (Signed Official Admin Management App, 5.66 MB)
* `setup_oracle.sh`: Automated one-click setup script for Ubuntu / Oracle Cloud VPS.
* `Dockerfile` & `package.json`: Containerized and standard Node.js deployment configurations.

---

## 🚀 Quick Deployment Guide

### Option 1: VPS / Ubuntu Deployment via PuTTY & WinSCP

1. **Upload Files via WinSCP**:
   * Connect to your Ubuntu VPS via WinSCP using SFTP.
   * Transfer `deploy_package` (or extract `mizoram-vc-deploy.zip`) into `/home/ubuntu/mizoram-vc/`.

2. **Run One-Click Setup via PuTTY**:
   * Connect to your server using PuTTY.
   * Navigate to the project folder and make the setup script executable:
     ```bash
     cd /home/ubuntu/mizoram-vc
     chmod +x setup_oracle.sh
     ./setup_oracle.sh
     ```
   * This script automatically installs Node.js 20, Nginx, PM2, and configures the reverse proxy on Port 80.

3. **Start the Application with PM2**:
   ```bash
   cd /home/ubuntu/mizoram-vc
   npm install --production
   pm2 start backend/server.js --name "mizoram-vc-backend"
   pm2 save
   pm2 startup
   ```

---

### Option 2: Render.com / Cloud Deployment (Anti-Sleep & Permanent Persistence)

* **Build Command**: `npm install`
* **Start Command**: `node backend/server.js`
* **Port**: `3000` (or dynamic `$PORT`)

#### 🛡️ How to Keep Database Permanently Saved Across Sleeps & Reboots:
Render's free tier spins down containers after 15 minutes of inactivity and resets ephemeral disks. To permanently protect your data:
1. **Prevent Sleep (Automated Keep-Alive)**:
   * In Render Dashboard ➔ Your Web Service ➔ **Environment**:
   * Add: `APP_URL` = `https://your-service-name.onrender.com`
   * The server will automatically ping its own `/api/health` endpoint every 10 minutes to stay awake 24/7!
2. **Permanent Cloud Database (Zero Cost)**:
   * **GitHub Gist (Easiest)**: Add `GITHUB_TOKEN` and `GIST_ID` (from gist.github.com) to Render Environment. All contacts, offices, and updates sync permanently to your private Gist.
   * **MongoDB Atlas (Free 512MB)**: Add `MONGODB_URI` = `mongodb+srv://user:pass@cluster.mongodb.net/mizoram_vc` to Render Environment.
3. **Admin Auto-Backup & 1-Click Disaster Recovery**:
   * The Admin Portal automatically stores local snapshots in the browser. If the server ever resets, a 1-click restore banner appears allowing instant restoration of all data to the server.

---

### Option 3: Docker Deployment

```bash
docker build -t mizoram-vc-directory .
docker run -d -p 3000:3000 --name mizoram-vc-app mizoram-vc-directory
```

---

## 📱 Android Applications

Pre-compiled and signed with the official `Kolasib District Administration` keystore:
* **Citizen Phonebook**: `release_apks/Mizoram_VC_Phonebook.apk`
* **Admin Management Portal**: `release_apks/Mizoram_VC_Admin.apk`
* Keystore fingerprint: `SHA-256: 91:BD:2C:DE:BF:3A:98:79:07:F6:0B:13:CB:63:18:62:0B:43:B7:A8:CE:E5:4F:4E:07:B5:2D:91:50:AB:5B:F1`
