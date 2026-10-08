#!/bin/bash
# ========================================================
# Mizoram VC Directory - Automated Oracle Cloud Setup Script
# Run this script on your Ubuntu server to configure everything automatically!
# ========================================================

set -e

echo "========================================================"
echo "🚀 MIZORAM VC DIRECTORY - ONE-CLICK ORACLE CLOUD SETUP"
echo "========================================================"

# Prevent interactive prompts from blocking installation
export DEBIAN_FRONTEND=noninteractive

echo "📦 1/5: Updating system packages..."
sudo apt-get update -y -q

echo "📦 2/5: Installing Node.js 20, Unzip, Git & Nginx..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y -q nodejs unzip git nginx iptables-persistent

echo "⚡ 3/5: Installing PM2 Process Manager..."
sudo npm install -g pm2

echo "🛡️ 4/5: Opening Ubuntu Firewall for Ports 80, 443, 3000..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 1 -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 1 -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save

echo "🌐 5/6: Configuring Nginx Reverse Proxy (Port 80 -> Port 3000)..."
cat << 'EOF' | sudo tee /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    # Increase maximum upload size for JSON / Sheets imports
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
EOF

sudo systemctl restart nginx
sudo systemctl enable nginx

echo "🚀 6/6: Installing Dependencies & Launching Application..."
if [ -f "package.json" ]; then
    npm install --production
    pm2 delete "mizoram-vc" 2>/dev/null || true
    pm2 start backend/server.js --name "mizoram-vc"
    pm2 save
    # Configure auto-start on boot
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true
fi

PUBLIC_IP=$(curl -s -4 ifconfig.me || curl -s -4 icanhazip.com || echo "YOUR_SERVER_IP")

echo "========================================================"
echo "🎉 MIZORAM VC DIRECTORY RUNNING ON ORACLE CLOUD!"
echo "========================================================"
echo "📱 Citizen App Download:  http://${PUBLIC_IP}/download/"
echo "📞 Citizen Web Phonebook: http://${PUBLIC_IP}/phonebook/"
echo "🛡️ Admin Management App:  http://${PUBLIC_IP}/admin/"
echo "📱 Live Phone Simulator:  http://${PUBLIC_IP}/"
echo "========================================================"
echo "⚠️  CRITICAL ORACLE CLOUD SECURITY NOTE:"
echo "If you cannot open the links above in your browser,"
echo "you must add an Ingress Rule in your Oracle Cloud Console:"
echo "1. Go to: Networking ➔ Virtual Cloud Networks ➔ Your VCN"
echo "2. Click: Security Lists ➔ Default Security List"
echo "3. Click: 'Add Ingress Rules'"
echo "   - Source CIDR:       0.0.0.0/0"
echo "   - Destination Port:  80, 443, 3000"
echo "   - Protocol:          TCP"
echo "========================================================"

