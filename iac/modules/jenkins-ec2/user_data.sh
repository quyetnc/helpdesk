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

# ─── Jenkins Init Scripts ──────────────────────────────────────────────────────
echo "[$(date)] [INFO] Step 5b: Configure Jenkins CSRF proxy compatibility..."
mkdir -p /var/jenkins_home/init.groovy.d
cat > /var/jenkins_home/init.groovy.d/csrf.groovy << 'EOF'
import jenkins.model.Jenkins
import hudson.security.csrf.DefaultCrumbIssuer

Jenkins.instance.setCrumbIssuer(new DefaultCrumbIssuer(true))
Jenkins.instance.save()
EOF

# ─── Jenkins Docker Container ─────────────────────────────────────────────────
echo "[$(date)] [INFO] Step 6: Build custom Jenkins image with AWS CLI, kubectl, Helm..."
JENKINS_BASE="jenkins/jenkins:2.504.1-jdk17"
JENKINS_IMAGE="jenkins-custom:latest"

# Write Dockerfile inline
cat > /tmp/Dockerfile.jenkins << 'DOCKERFILE'
FROM jenkins/jenkins:2.504.1-jdk17

USER root

RUN apt-get update -qq && apt-get install -y -qq curl unzip

# AWS CLI v2
RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip \
    && unzip -q /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/awscliv2.zip /tmp/aws

# kubectl — pinned to match EKS cluster version
RUN curl -fsSLo /usr/local/bin/kubectl \
    "https://dl.k8s.io/release/v1.30.0/bin/linux/amd64/kubectl" \
    && chmod +x /usr/local/bin/kubectl

# Helm
RUN curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 \
    | DESIRED_VERSION=v3.14.0 bash

USER jenkins
DOCKERFILE

docker build -f /tmp/Dockerfile.jenkins -t "$JENKINS_IMAGE" .
echo "[$(date)] [INFO] Custom Jenkins image built: ${JENKINS_IMAGE}"

echo "[$(date)] [INFO] Step 7: Start Jenkins container..."
docker run -d \
  --name jenkins \
  --restart always \
  -p 8080:8080 \
  -p 50000:50000 \
  -v /var/jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
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
  if JENKINS_PASSWORD=$(docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null); then
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
