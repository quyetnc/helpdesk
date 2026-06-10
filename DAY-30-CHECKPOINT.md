# Day 30 Checkpoint — Complete Deployment Status

**Date:** 2026-06-09  
**Status:** Infrastructure ✅ | Services ✅ | Jenkins ⚠️ (needs newer LTS)

---

## ✅ COMPLETED TODAY

### 1. **AWS EKS Cluster** ✅
- [x] VPC created (public + private subnets)
- [x] EKS cluster deployed (1.30, helpdesk-dev-cluster)
- [x] 2 worker nodes (t3.medium, SPOT instances)
- [x] OIDC provider configured
- [x] IAM roles for EBS CSI Driver, Cluster Autoscaler
- [x] EBS StorageClass (gp3, gp3-dev) created
- [x] NGINX Ingress + ALB deployed

**Access kubeconfig:**
```bash
aws eks update-kubeconfig --name helpdesk-dev-cluster --region ap-northeast-1
```

---

### 2. **Databases Deployed** ✅

#### PostgreSQL (Users Database)
- [x] Helm release: `postgres-users`
- [x] Database: `users_db`
- [x] Host: `postgres-users-postgresql.default.svc.cluster.local:5432`
- [x] User: `postgres` | Password: `postgres-dev-123`
- [x] Storage: 1Gi (EBS gp3-dev)

#### PostgreSQL (Tickets Database)
- [x] Helm release: `postgres-tickets`
- [x] Database: `tickets_db`
- [x] Host: `postgres-tickets-postgresql.default.svc.cluster.local:5432`
- [x] User: `postgres` | Password: `postgres-dev-123`
- [x] Storage: 1Gi (EBS gp3-dev)

#### Redis Cache
- [x] Helm release: `my-redis`
- [x] Host: `my-redis-master.default.svc.cluster.local:6379`
- [x] Port: 6379 (no auth)
- [x] Storage: 1Gi (EBS gp3-dev)

#### RabbitMQ Message Queue
- [x] Kubernetes StatefulSet (not Helm)
- [x] Image: `rabbitmq:3.12-management-alpine`
- [x] Host: `rabbitmq.default.svc.cluster.local:5672`
- [x] AMQP Port: 5672
- [x] Management UI: 15672
- [x] User: `user` | Password: `rabbitmq-dev-123`
- [x] Storage: 1Gi (EBS gp3-dev)

**Deploy script:**
```bash
./deploy-databases.sh
```

---

### 3. **Microservices Deployed** ✅

#### Helm Chart (k8s-new/helm/)
- [x] Unified Helm chart with 5 services (no RabbitMQ in chart)
- [x] Image tag: `27d6498` (git commit SHA)
- [x] All services with ConfigMap + Secret injection
- [x] Health checks configured
- [x] HPA enabled (minReplicas: 1, maxReplicas: varies)
- [x] Resource limits set

**Services:**

| Service | Port | Replicas | Image |
|---------|------|----------|-------|
| api-gateway | 3000 | 2 (HPA: 1-3) | 27d6498 |
| user-service | 3001 | 2 (HPA: 1-3) | 27d6498 |
| ticket-service | 3002 | 2 (HPA: 1-3) | 27d6498 |
| notification-service | 3003 | 1 (no HPA) | 27d6498 |
| frontend | 3100 | 2 (HPA: 1-2) | 27d6498 |

**Deploy services:**
```bash
helm install helpdesk k8s-new/helm \
  -f k8s-new/helm/environments/dev/values.yaml \
  -n default \
  --wait \
  --timeout 300s
```

**Verify:**
```bash
kubectl get pods -n default
kubectl get svc -n default
kubectl get ingress -n default
```

---

### 4. **Public Access (Ingress + ALB)** ✅

- [x] NGINX Ingress Controller deployed
- [x] AWS Network Load Balancer created
- [x] Ingress routes configured:
  - `/` → frontend (3100)
  - `/api` → api-gateway (3000)

**Access application:**
```
http://a0c159b5bc43247ee85eba9bc499a5e7-1737627351.ap-northeast-1.elb.amazonaws.com/
```

**Get ALB URL:**
```bash
kubectl get ingress helpdesk-ingress -o wide
```

---

### 5. **Jenkins CI/CD Foundation** ⚠️

#### Deployed
- [x] Jenkins EC2 (t3.medium) in same VPC
- [x] Docker container running
- [x] Accessible at `http://<jenkins-ip>:8080`
- [x] Initial admin password: `6e8405a5a70f4db7b90703a4a1722328`
- [x] Internet connectivity verified (can reach updates.jenkins.io)

#### Get Jenkins URL:
```bash
cd iac/environments/dev
terraform output jenkins_url
terraform output jenkins_public_ip
```

#### Status
- ⚠️ **Plugin installation FAILING** — Jenkins 2.426.1 is too old
- ⚠️ Plugins require Jenkins 2.479.1+
- **Fix needed:** Rebuild with newer LTS version

---

## ⚠️ TODO FOR DAY 30

### 1. **Fix Jenkins (HIGH PRIORITY)**
```bash
# Edit iac/modules/jenkins-ec2/user_data.sh
# Change: JENKINS_IMAGE="jenkins/jenkins:2.426.1-jdk17"
# To:     JENKINS_IMAGE="jenkins/jenkins:2.448.3-lts-jdk17"

# Then rebuild:
cd iac/environments/dev
terraform destroy -target=module.jenkins_ec2 -auto-approve
sleep 30
terraform apply -target=module.jenkins_ec2 -auto-approve
```

### 2. **Configure Jenkins Plugins**
- [ ] Install Kubernetes plugin
- [ ] Install Docker plugin
- [ ] Install Git plugin
- [ ] Install Pipeline plugin

### 3. **Configure Jenkins → EKS Access**
- [ ] Add kubeconfig to Jenkins credentials
- [ ] Configure Kubernetes cloud (Jenkins → Manage Jenkins → Configure System)
- [ ] Test connectivity to EKS cluster

### 4. **Create First CI/CD Job**
- [ ] Create Jenkinsfile in GitHub
- [ ] Build Docker image from source
- [ ] Push to ECR (905418181527.dkr.ecr.ap-northeast-1.amazonaws.com)
- [ ] Deploy to EKS via kubectl
- [ ] Test full pipeline

### 5. **Multi-Environment Strategy**
- [ ] Create prod environment (iac/environments/prod/)
- [ ] Test promotion pipeline (dev → staging → prod)
- [ ] Document rollback procedure

---

## 🔑 Important Credentials & URLs

### AWS
- **Region:** ap-northeast-1
- **Account ID:** 905418181527
- **ECR:** 905418181527.dkr.ecr.ap-northeast-1.amazonaws.com

### EKS Cluster
- **Name:** helpdesk-dev-cluster
- **Kubeconfig:** `aws eks update-kubeconfig --name helpdesk-dev-cluster --region ap-northeast-1`

### Jenkins
- **URL:** http://<jenkins-ip>:8080
- **Admin User:** admin
- **Initial Password:** 6e8405a5a70f4db7b90703a4a1722328
- **EC2 Key:** quyetnc-kp.pem
- **SSH:** `ssh -i quyetnc-kp.pem ubuntu@<jenkins-ip>`

### Database Credentials
```
PostgreSQL: postgres / postgres-dev-123
RabbitMQ: user / rabbitmq-dev-123
Redis: no auth
```

### Application URLs
```
Frontend: http://a0c159b5bc43247ee85eba9bc499a5e7-...elb.amazonaws.com/
API: http://a0c159b5bc43247ee85eba9bc499a5e7-...elb.amazonaws.com/api
```

---

## 📁 Important Files

```
iac/
  ├── modules/
  │   ├── jenkins-ec2/          ← Update JENKINS_IMAGE here
  │   ├── eks/
  │   ├── vpc/
  │   └── ebs-storage/
  └── environments/dev/
      ├── main.tf
      ├── variables.tf
      ├── terraform.tfvars
      └── outputs.tf

helpdesk/
  ├── deploy-databases.sh        ← Run this to deploy/upgrade DBs
  ├── destroy-databases.sh       ← Run this to destroy DBs
  ├── k8s-new/
  │   ├── helm/
  │   │   ├── Chart.yaml
  │   │   ├── values.yaml
  │   │   ├── templates/
  │   │   ├── environments/dev/values.yaml
  │   │   └── values-db/         ← Database Helm values
  │   └── deployments/
  │       └── rabbitmq.yaml      ← RabbitMQ StatefulSet
  └── build-and-push-images.sh   ← Build + push to ECR
```

---

## 🚀 Quick Commands Tomorrow

```bash
# Check all resources
kubectl get all -n default

# View logs
kubectl logs -f <pod-name> -n default

# Restart service
kubectl rollout restart deployment/api-gateway -n default

# Upgrade app
helm upgrade helpdesk k8s-new/helm -f k8s-new/helm/environments/dev/values.yaml -n default

# Rebuild Jenkins
cd iac/environments/dev && terraform apply -target=module.jenkins_ec2 -auto-approve

# SSH to Jenkins EC2
ssh -i quyetnc-kp.pem ubuntu@<jenkins-ip>
```

---

## 📊 What's Working

✅ EKS cluster (stable, 2 nodes)
✅ All 3 databases (PostgreSQL + Redis + RabbitMQ)
✅ All 5 microservices (running, healthy)
✅ Public ingress (ALB + NGINX)
✅ Jenkins running (but needs newer LTS)
✅ Infrastructure as Code (fully Terraform-managed)

---

## 🎯 Next Steps (Priority Order)

1. **FIX JENKINS** (blocker for CI/CD)
   - Rebuild with Jenkins 2.448.3-lts-jdk17
   
2. **Configure Kubernetes plugin**
   - Link Jenkins → EKS
   
3. **Create first build job**
   - Build Docker image
   - Push to ECR
   - Deploy to EKS
   
4. **Test CI/CD pipeline end-to-end**
   - Commit to GitHub
   - Jenkins builds + pushes
   - EKS auto-deploys

---

**Last Updated:** 2026-06-09 16:00 UTC  
**Estimated Time for Day 30:** 2-3 hours
