#!/bin/bash
set -euo pipefail

# Redirect all output to logfile for debugging
LOG_FILE="/var/log/jenkins-setup.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo "[$(date)] [INFO] Starting Jenkins installation via Docker..."

# ─── Prerequisites ────────────────────────────────────────────────────────────
echo "[$(date)] [INFO] Step 1: Update system packages..."
apt-get update -qq
# Skip full upgrade - too risky in user_data. Only install necessary packages.

# ─── Docker Installation ──────────────────────────────────────────────────────
echo "[$(date)] [INFO] Step 2: Install Docker..."
apt-get install -y -qq docker.io
systemctl enable docker
systemctl start docker
docker --version

# ─── AWS CLI & kubectl ────────────────────────────────────────────────────────
echo "[$(date)] [INFO] Step 3: Install AWS CLI..."
apt-get install -y -qq awscli

echo "[$(date)] [INFO] Step 4: Install kubectl..."
KUBECTL_VERSION="v1.30.0"  # Pin version for reproducibility
curl -fsSLo /usr/local/bin/kubectl "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl"
chmod +x /usr/local/bin/kubectl
kubectl version --client

# ─── Jenkins Data Directory ────────────────────────────────────────────────────
echo "[$(date)] [INFO] Step 5: Create Jenkins data directory..."
mkdir -p /var/jenkins_home
chmod 750 /var/jenkins_home  # Secure: only owner can read/write

# ─── Jenkins Docker Container ─────────────────────────────────────────────────
echo "[$(date)] [INFO] Step 6: Pull Jenkins Docker image..."
JENKINS_IMAGE="jenkins/jenkins:2.426.1-jdk17"  # Pin specific version
docker pull "$JENKINS_IMAGE"

echo "[$(date)] [INFO] Step 7: Start Jenkins container..."
docker run -d \
  --name jenkins \
  --restart always \
  -p 8080:8080 \
  -p 50000:50000 \
  -v /var/jenkins_home:/var/jenkins/ref \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e JENKINS_OPTS="--httpPort=8080" \
  -e JAVA_OPTS="-Xmx512m -Xms256m" \
  --memory=1g \
  --cpus=1 \
  "$JENKINS_IMAGE"

echo "[$(date)] [INFO] Step 8: Waiting for Jenkins to initialize (60 seconds)..."
sleep 60

# Verify Jenkins is running
if ! docker ps | grep -q jenkins; then
  echo "[$(date)] [ERROR] Jenkins container failed to start!"
  docker logs jenkins || true
  exit 1
fi

# ─── Get Initial Password ─────────────────────────────────────────────────────
echo "[$(date)] [INFO] Step 9: Retrieving Jenkins initial admin password..."
for attempt in {1..5}; do
  if JENKINS_PASSWORD=$(docker exec jenkins cat /var/jenkins/secrets/initialAdminPassword 2>/dev/null); then
    echo "[$(date)] [INFO] Successfully retrieved password on attempt $attempt"
    break
  fi
  echo "[$(date)] [INFO] Password not ready yet, retrying... ($attempt/5)"
  sleep 10
done

if [ -z "$${JENKINS_PASSWORD:-}" ]; then
  echo "[$(date)] [WARNING] Could not retrieve password from container"
  JENKINS_PASSWORD="CHECK_DOCKER_LOGS"
fi

# ─── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "[$(date)] [✓] Jenkins Docker installation complete!"
echo "[$(date)] [INFO] ═══════════════════════════════════════════════════════════"
echo "[$(date)] [INFO] Jenkins Web UI: http://$(hostname -I | awk '{print $1}'):8080"
echo "[$(date)] [INFO] Initial Admin Password: $JENKINS_PASSWORD"
echo "[$(date)] [INFO] Setup log: $LOG_FILE"
echo "[$(date)] [INFO] ═══════════════════════════════════════════════════════════"
echo ""
