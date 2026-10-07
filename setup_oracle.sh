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

echo "🌐 5/5: Configuring Nginx Reverse Proxy (Port 80 -> Port 3000)..."
cat << 'EOF' | sudo tee /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
EOF

sudo systemctl restart nginx
sudo systemctl enable nginx

echo "========================================================"
echo "✅ SERVER SETUP SUCCESSFULLY COMPLETED!"
echo "Node.js Version: $(node -v)"
echo "NPM Version:     $(npm -v)"
echo "PM2 Version:     $(pm2 -v)"
echo "Nginx Proxy:     Active (Port 80 -> Port 3000)"
echo "========================================================"
