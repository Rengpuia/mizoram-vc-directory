# 🏛️ Mizoram VC Directory Suite - Deployment Package

Complete deployment bundle for the **Mizoram State & Kolasib District Village Council (VC) Phonebook, Administrative Management Portal & Real-Time Sync Backend**.

---

## 📦 Package Contents

* `backend/`: Node.js Express sync server, REST API, SSE push engine, and database store.
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

### Option 2: Render.com / Cloud Deployment

* **Build Command**: `npm install`
* **Start Command**: `node backend/server.js`
* **Port**: `3000` (or dynamic `$PORT`)

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
