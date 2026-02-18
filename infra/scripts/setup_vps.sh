#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo bash infra/scripts/setup_vps.sh"
  exit 1
fi

APP_USER="${APP_USER:-$SUDO_USER}"

apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release git ufw fail2ban

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

if [[ -n "$APP_USER" ]]; then
  usermod -aG docker "$APP_USER"
fi

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

systemctl enable --now docker
systemctl enable --now fail2ban

mkdir -p /opt/axioma-local /opt/axioma-backups
chown -R "$APP_USER":"$APP_USER" /opt/axioma-local /opt/axioma-backups || true

echo "VPS bootstrap complete. Re-login for docker group to apply."
