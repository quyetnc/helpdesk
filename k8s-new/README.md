# Helpdesk Microservices — Helm + Argo CD Ready

**One Helm chart. Three environments. Argo CD native.**

## 📁 Structure

```
k8s-new/
├── helm/                          # Single Helm chart (all services)
│   ├── Chart.yaml
│   ├── values.yaml                # Global defaults
│   ├── templates/
│   │   ├── deployment.yaml        # 6 services (looped)
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   ├── configmap.yaml         # Templated from values
│   │   ├── secret.yaml
│   │   └── ingress.yaml
│   └── environments/
│       ├── dev/values.yaml        # Dev overrides
│       ├── staging/values.yaml    # Staging overrides
│       └── prod/values.yaml       # Prod overrides
│
└── argocd/                         # Argo CD apps
    ├── dev-app.yaml
    ├── staging-app.yaml
    └── prod-app.yaml
```

## 🚀 Quick Start

### Deploy DEV with Helm (manual)
```bash
cd k8s-new
helm install helpdesk-dev helm -f helm/environments/dev/values.yaml -n default
```

### Verify
```bash
helm list -n default
kubectl get deployments,pods,svc,hpa
```

### Deploy STAGING
```bash
helm install helpdesk-staging helm -f helm/environments/staging/values.yaml -n staging
```

### Deploy PROD
```bash
helm install helpdesk-prod helm -f helm/environments/prod/values.yaml -n prod
```

## 🔄 Argo CD (Future)

Once Argo CD is installed, apply the app definitions:

```bash
kubectl apply -f argocd/dev-app.yaml
kubectl apply -f argocd/staging-app.yaml
kubectl apply -f argocd/prod-app.yaml
```

Argo CD will automatically sync these apps from git!

## ✏️ Updating Values

### Change image tag for all services
Edit `helm/environments/dev/values.yaml`:
```yaml
services:
  api-gateway:
    image:
      tag: "new-commit-sha"  # Update once per env
```

### Add a new environment variable
Edit `helm/values.yaml`:
```yaml
configMaps:
  api-gateway-config:
    NEW_VAR: "value"
```

### Change replicas in staging
Edit `helm/environments/staging/values.yaml`:
```yaml
services:
  api-gateway:
    replicaCount: 5
```

## 🔑 Secret Management (TODO)

Current: Secrets in `helm/values.yaml` (dev only).

Production should use **AWS Secrets Manager**:
1. Store secrets in AWS Secrets Manager
2. Install `external-secrets` operator in cluster
3. Create SecretStore pointing to AWS
4. Reference external secrets in values

## 📊 What Gets Deployed

Per environment:
- ✅ 6 Deployments (api-gateway, user-service, ticket-service, notification-service, frontend, rabbitmq)
- ✅ 6 Services
- ✅ 4 HPA (api-gateway, user-service, ticket-service, frontend)
- ✅ 5 ConfigMaps
- ✅ 4 Secrets
- ✅ 1 Ingress (NGINX)

**Total: ~25-30 resources per environment**

## 🎯 Best Practices Implemented

- ✅ Single source of truth (one Helm chart)
- ✅ DRY (templates with loops)
- ✅ Environment parity (dev/staging/prod with overrides)
- ✅ Resource limits & requests
- ✅ Health checks (readiness + liveness)
- ✅ HPA for scaling
- ✅ Argo CD ready
- ✅ CI/CD friendly

## 🚨 Before Deploying to PROD

1. **Update image tags** to actual commit SHAs in ECR
2. **Update secrets** to real production values
3. **Change replicas** to appropriate levels for load
4. **Enable TLS** in ingress annotations
5. **Review resource limits** based on actual usage
6. **Test in staging** first!

## 🔗 Related

- CI/CD pipeline: `../.github/workflows/`
- IaC (Terraform): `../iac/`
- Services: `../services/`
