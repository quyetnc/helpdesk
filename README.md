# Helpdesk — Production-Grade Microservices System

A scalable, cloud-native support ticket management system deployed on AWS EKS with Kubernetes, Helm, and Infrastructure as Code.

## Quick Start

### Prerequisites
- AWS account with permissions for EKS, RDS, ElastiCache
- `awscli` v2+, `kubectl` v1.30+, `helm` v3.10+, `terraform` v1.0+
- Docker (for local development)

### Deploy to AWS (5 minutes)

```bash
# 1. Configure AWS credentials
aws sts get-caller-identity

# 2. Provision infrastructure (EKS, VPC, storage)
cd iac && terraform init && terraform apply
cd ..

# 3. Deploy databases (PostgreSQL, Redis, RabbitMQ)
./deploy-databases.sh

# 4. Build and push container images to ECR
./build-and-push-images.sh

# 5. Deploy services via Helm
helm install helpdesk ./k8s-new/helm \
  -f k8s-new/helm/environments/dev/values.yaml \
  --wait --timeout 300s

# 6. Get ingress URL
kubectl get ingress
```

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AWS EKS Cluster                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────┐   │
│  │   Frontend   │   │  API Gateway │   │ Prometheus │   │
│  │   (React)    │   │  (Port 3000) │   │ (Metrics)  │   │
│  └──────────────┘   └──────────────┘   └────────────┘   │
│         ↓                   ↓                              │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────┐   │
│  │ User Service │   │ Ticket Svc   │   │Notification│   │
│  │  (Port 3001) │   │ (Port 3002)  │   │(Port 3003) │   │
│  └──────────────┘   └──────────────┘   └────────────┘   │
│         ↓                   ↓                   ↓          │
├─────────────────────────────────────────────────────────┤
│                   Stateful Services                       │
│  PostgreSQL (Users) | PostgreSQL (Tickets) | Redis Cache │
│         RabbitMQ (Message Queue)                         │
└─────────────────────────────────────────────────────────┘
```

## Services

| Service | Type | Port | Language | Role |
|---------|------|------|----------|------|
| **api-gateway** | Node.js | 3000 | TypeScript | API routing, authentication, rate limiting |
| **user-service** | Node.js | 3001 | TypeScript | User management, registration, authentication |
| **ticket-service** | Node.js | 3002 | TypeScript | Ticket CRUD, SLA calculation, workflows |
| **notification-service** | Node.js | 3003 | TypeScript | Email/SMS notifications, event processing |
| **frontend** | React | 3100 | TypeScript | Web UI, ticket dashboard |

## Key Infrastructure

| Component | Status | Details |
|-----------|--------|---------|
| **EKS Cluster** | ✅ Deployed | v1.30, 2× t3.medium SPOT nodes, auto-scaling enabled |
| **Storage** | ✅ Deployed | EBS gp3 StorageClass, 1Gi per database |
| **Ingress** | ✅ Deployed | NGINX + AWS ALB, TLS-ready |
| **Databases** | ✅ Deployed | PostgreSQL (×2), Redis, RabbitMQ |
| **CI/CD** | ⚠️ In Progress | GitHub Actions + Jenkins platform (see [cicd-platform/](cicd-platform/)) |

## Directory Structure

```
helpdesk/
├── iac/                          # Terraform modules (EKS, VPC, IAM)
│   ├── environments/             # dev, test, prod configs
│   └── modules/                  # Reusable module definitions
├── k8s-new/                      # Kubernetes manifests & Helm charts
│   └── helm/                     # Unified Helm chart for all services
├── cicd-platform/               # Shared CI/CD workflows & pipelines
├── api-gateway/                 # API gateway service
├── user-service/                # User management service
├── ticket-service/              # Ticket management service
├── notification-service/        # Notification service
├── frontend/                    # React web application
├── scripts/                     # Helper scripts
├── build-and-push-images.sh    # Build & push Docker images to ECR
├── deploy-databases.sh          # Deploy databases to K8s
└── destroy-databases.sh         # Cleanup databases
```

## Documentation

- **[AWS-DEPLOYMENT-PLAN.md](AWS-DEPLOYMENT-PLAN.md)** — Step-by-step AWS deployment guide
- **[DAY-30-CHECKPOINT.md](DAY-30-CHECKPOINT.md)** — Current deployment status & troubleshooting
- **[AUDIT-2026-06-07.md](AUDIT-2026-06-07.md)** — System audit, gaps, recommendations
- **[HELM_MIGRATION_GUIDE.md](HELM_MIGRATION_GUIDE.md)** — Helm chart migration notes
- **[DEPLOYMENT-SETUP-COMPLETE.md](DEPLOYMENT-SETUP-COMPLETE.md)** — Infrastructure setup status

Service-level documentation:
- [api-gateway/README.md](api-gateway/README.md)
- [user-service/README.md](user-service/README.md)
- [ticket-service/README.md](ticket-service/README.md)
- [notification-service/README.md](notification-service/README.md)
- [frontend/README.md](frontend/README.md)
- [iac/README.md](iac/README.md)

## Common Commands

### Kubernetes

```bash
# Get cluster info
kubectl get nodes
kubectl get pods -A
kubectl get svc -A

# View logs
kubectl logs -f deployment/api-gateway
kubectl logs -f deployment/user-service

# Port-forward for local access
kubectl port-forward svc/api-gateway 3000:3000

# Scale services
kubectl scale deployment user-service --replicas=3

# Check resource usage
kubectl top nodes
kubectl top pods
```

### Helm

```bash
# Install/upgrade release
helm install helpdesk ./k8s-new/helm -f k8s-new/helm/environments/dev/values.yaml
helm upgrade helpdesk ./k8s-new/helm -f k8s-new/helm/environments/dev/values.yaml

# List releases
helm list -A

# Rollback to previous version
helm rollback helpdesk

# Get release values
helm get values helpdesk
```

### Terraform

```bash
# Plan infrastructure changes
cd iac && terraform plan -var="environment=dev"

# Apply infrastructure
terraform apply -var="environment=dev"

# Destroy infrastructure (⚠️ careful!)
terraform destroy -var="environment=dev"

# State management
terraform state list
terraform state show aws_eks_cluster.main
```

### Docker (Local Development)

```bash
# Build image locally
docker build -t helpdesk/api-gateway:local api-gateway/

# Run service locally
docker run -p 3000:3000 -e DATABASE_URL=... helpdesk/api-gateway:local

# Push to ECR
./build-and-push-images.sh
```

## Environment Variables

All services use environment variables for configuration:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379
RABBITMQ_URL=amqp://user:pass@host:5672

# API
JWT_SECRET=your-secret-key
API_PORT=3000
LOG_LEVEL=debug

# See individual service README files for complete list
```

## Deployment Environments

Three deployment environments with separate configurations:

| Environment | Cluster | Nodes | Replicas | Status |
|-------------|---------|-------|----------|--------|
| **dev** | helpdesk-dev-cluster | 2× t3.medium | 1-3 (HPA) | ✅ Active |
| **test** | helpdesk-test-cluster | 2× t3.medium | 1-3 (HPA) | 🔄 Ready |
| **prod** | helpdesk-prod-cluster | 3× t3.large | 2-5 (HPA) | 🔄 Ready |

Deploy to specific environment:
```bash
helm install helpdesk ./k8s-new/helm \
  -f k8s-new/helm/environments/ENVIRONMENT/values.yaml
```

## Troubleshooting

### Pod won't start
```bash
# Check pod events
kubectl describe pod POD_NAME

# View logs
kubectl logs POD_NAME
kubectl logs POD_NAME --previous  # Previous run logs
```

### Service connectivity
```bash
# Check service DNS (inside cluster)
kubectl run -it debug --image=busybox -- sh
nslookup api-gateway.default.svc.cluster.local
```

### Database connections
```bash
# Connect to PostgreSQL
kubectl run -it postgres-client --image=postgres:15 -- \
  psql -h postgres-users-postgresql -U postgres

# Check RabbitMQ management UI (port-forward 15672)
kubectl port-forward svc/rabbitmq 15672:15672
```

See **[DAY-30-CHECKPOINT.md](DAY-30-CHECKPOINT.md)** for detailed troubleshooting.

## Monitoring & Observability

Services export metrics to Prometheus (port 9090):
```bash
# Access Prometheus dashboard
kubectl port-forward svc/prometheus-service 9090:9090
# Then visit http://localhost:9090
```

Logs are aggregated via `kubectl logs`. For production, configure:
- **ELK Stack** (Elasticsearch, Logstash, Kibana) for centralized logging
- **Grafana** for metrics visualization
- **AlertManager** for incident notifications

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m "feat: add X"`
4. Push to branch: `git push origin feat/your-feature`
5. Open a pull request

See individual service READMEs for development setup.

## Security Considerations

- ✅ Database credentials stored in Kubernetes Secrets (not git)
- ✅ TLS enabled on all external connections
- ✅ RBAC configured for service accounts
- ✅ Network policies restrict traffic between services
- ⚠️ TODO: Enable Pod Security Policies
- ⚠️ TODO: Implement image scanning in CI/CD

## Cost Optimization

**Current Cost (dev environment):** ~$150-200/month

To reduce costs:
- Use SPOT instances for non-critical workloads (✅ already enabled)
- Schedule cluster down during off-hours: `kubectl scale deployment --replicas=0`
- Use RDS Aurora Serverless instead of self-managed PostgreSQL
- Enable S3 lifecycle policies for logs

## Support & Issues

- **Deployment Issues:** See [AWS-DEPLOYMENT-PLAN.md](AWS-DEPLOYMENT-PLAN.md)
- **Service Bugs:** Create an issue in the relevant service repository
- **Infrastructure:** File issue in [iac/](iac/) with tags `terraform`, `aws`, `eks`

## License

Proprietary — All Rights Reserved

---

**Last Updated:** 2026-06-10  
**Maintainers:** DevOps Team  
**Status:** Production-Ready ✅
