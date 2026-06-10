#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# Deploy Databases to Kubernetes (PostgreSQL + Redis + RabbitMQ)
# ═══════════════════════════════════════════════════════════════════════════
# Usage: ./deploy-databases.sh
# Purpose: Install PostgreSQL (users/tickets), Redis via Helm, and RabbitMQ via Kubernetes manifest
# ═══════════════════════════════════════════════════════════════════════════

# ─── Configuration ──────────────────────────────────────────────────────────
NAMESPACE="default"
HELM_REPO="bitnami"
HELM_REPO_URL="https://charts.bitnami.com/bitnami"
TIMEOUT="300s"

# Database releases
POSTGRES_USERS_RELEASE="postgres-users"
POSTGRES_TICKETS_RELEASE="postgres-tickets"
REDIS_RELEASE="my-redis"

# ─── Colors for output ──────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ─── Functions ──────────────────────────────────────────────────────────────

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$*${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Verify prerequisites
verify_prerequisites() {
    log_info "Verifying prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    # Check helm
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed"
        exit 1
    fi

    # Verify kubectl cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Check kubeconfig."
        exit 1
    fi

    # Verify namespace exists
    if ! kubectl get namespace "${NAMESPACE}" &> /dev/null; then
        log_warning "Namespace '${NAMESPACE}' does not exist. Creating..."
        if ! kubectl create namespace "${NAMESPACE}"; then
            log_error "Failed to create namespace '${NAMESPACE}'"
            exit 1
        fi
    fi

    log_success "All prerequisites verified"
}

# Add Helm repository
add_helm_repo() {
    log_info "Adding Helm repository: ${HELM_REPO}..."

    if helm repo list | grep -q "^${HELM_REPO}"; then
        log_info "Repository ${HELM_REPO} already exists. Updating..."
    else
        if ! helm repo add "${HELM_REPO}" "${HELM_REPO_URL}"; then
            log_error "Failed to add Helm repository"
            exit 1
        fi
    fi

    if ! helm repo update "${HELM_REPO}"; then
        log_error "Failed to update Helm repository"
        exit 1
    fi

    log_success "Helm repository ready"
}

# Check if release already exists
release_exists() {
    local release=$1
    helm list -n "${NAMESPACE}" | grep -q "^${release}\s" && return 0 || return 1
}

# Deploy PostgreSQL
deploy_postgres() {
    local release=$1
    local values_file=$2
    local description=$3

    log_info "Deploying ${description}..."

    # Check if values file exists
    if [ ! -f "${values_file}" ]; then
        log_error "Values file not found: ${values_file}"
        return 1
    fi

    # Check if release already exists
    if release_exists "${release}"; then
        log_warning "Release '${release}' already exists. Upgrading..."
        if ! helm upgrade "${release}" "${HELM_REPO}/postgresql" \
            -f "${values_file}" \
            -n "${NAMESPACE}" \
            --wait \
            --timeout "${TIMEOUT}"; then
            log_error "Failed to upgrade ${description}"
            return 1
        fi
    else
        if ! helm install "${release}" "${HELM_REPO}/postgresql" \
            -f "${values_file}" \
            -n "${NAMESPACE}" \
            --wait \
            --timeout "${TIMEOUT}"; then
            log_error "Failed to install ${description}"
            return 1
        fi
    fi

    log_success "Deployed: ${description}"
}

# Deploy Redis
deploy_redis() {
    local release=$1
    local values_file=$2
    local description=$3

    log_info "Deploying ${description}..."

    # Check if values file exists
    if [ ! -f "${values_file}" ]; then
        log_error "Values file not found: ${values_file}"
        return 1
    fi

    # Check if release already exists
    if release_exists "${release}"; then
        log_warning "Release '${release}' already exists. Upgrading..."
        if ! helm upgrade "${release}" "${HELM_REPO}/redis" \
            -f "${values_file}" \
            -n "${NAMESPACE}" \
            --wait \
            --timeout "${TIMEOUT}"; then
            log_error "Failed to upgrade ${description}"
            return 1
        fi
    else
        if ! helm install "${release}" "${HELM_REPO}/redis" \
            -f "${values_file}" \
            -n "${NAMESPACE}" \
            --wait \
            --timeout "${TIMEOUT}"; then
            log_error "Failed to install ${description}"
            return 1
        fi
    fi

    log_success "Deployed: ${description}"
}

# Deploy RabbitMQ via Kubernetes manifest
deploy_rabbitmq() {
    local manifest_path=$1
    local description=$2

    log_info "Deploying ${description}..."

    # Check if manifest exists
    if [ ! -f "${manifest_path}" ]; then
        log_error "Manifest not found: ${manifest_path}"
        return 1
    fi

    # Create secret if not exists
    if ! kubectl get secret rabbitmq-secret -n "${NAMESPACE}" &> /dev/null; then
        log_info "Creating rabbitmq-secret..."
        if ! kubectl create secret generic rabbitmq-secret \
            --from-literal=RABBITMQ_USERNAME=user \
            --from-literal=RABBITMQ_PASSWORD=rabbitmq-dev-123 \
            -n "${NAMESPACE}"; then
            log_error "Failed to create rabbitmq-secret"
            return 1
        fi
    fi

    # Apply manifest
    if ! kubectl apply -f "${manifest_path}" -n "${NAMESPACE}"; then
        log_error "Failed to apply ${description} manifest"
        return 1
    fi

    # Wait for pod to be ready
    if ! kubectl wait --for=condition=ready pod -l app=rabbitmq -n "${NAMESPACE}" --timeout=300s 2>/dev/null; then
        log_warning "RabbitMQ pod not ready yet (may still be initializing)"
    fi

    log_success "Deployed: ${description}"
}

# Verify deployments
verify_deployments() {
    log_info "Verifying database deployments..."

    echo ""
    log_info "Checking pods..."
    kubectl get pods -n "${NAMESPACE}" -l "app.kubernetes.io/instance in (${POSTGRES_USERS_RELEASE},${POSTGRES_TICKETS_RELEASE},${REDIS_RELEASE})" --no-headers
    kubectl get pods -n "${NAMESPACE}" -l "app=rabbitmq" --no-headers

    echo ""
    log_info "Checking services..."
    kubectl get svc -n "${NAMESPACE}" -l "app.kubernetes.io/instance in (${POSTGRES_USERS_RELEASE},${POSTGRES_TICKETS_RELEASE},${REDIS_RELEASE})" --no-headers
    kubectl get svc -n "${NAMESPACE}" -l "app=rabbitmq" --no-headers

    echo ""
    log_success "Databases deployed successfully!"
}

# Get connection info
show_connection_info() {
    log_section "Database Connection Information"

    echo ""
    log_info "PostgreSQL (Users Database):"
    echo "  Host: ${POSTGRES_USERS_RELEASE}-postgresql.${NAMESPACE}.svc.cluster.local"
    echo "  Port: 5432"
    echo "  Database: users_db"
    echo "  User: postgres"
    echo "  Password: (see ConfigMap/Secret)"

    echo ""
    log_info "PostgreSQL (Tickets Database):"
    echo "  Host: ${POSTGRES_TICKETS_RELEASE}-postgresql.${NAMESPACE}.svc.cluster.local"
    echo "  Port: 5432"
    echo "  Database: tickets_db"
    echo "  User: postgres"
    echo "  Password: (see ConfigMap/Secret)"

    echo ""
    log_info "Redis:"
    echo "  Host: ${REDIS_RELEASE}-master.${NAMESPACE}.svc.cluster.local"
    echo "  Port: 6379"
    echo "  Auth: Disabled"

    echo ""
    log_info "RabbitMQ:"
    echo "  Host: rabbitmq.${NAMESPACE}.svc.cluster.local"
    echo "  Port: 5672 (AMQP)"
    echo "  Management UI: 15672"
    echo "  User: user"
    echo "  Password: rabbitmq-dev-123"

    echo ""
    log_info "To test connection from a pod:"
    echo "  kubectl run -it --rm debug --image=busybox --restart=Never -- /bin/sh"
    echo "  nc -zv postgres-users-postgresql 5432"
    echo "  nc -zv my-redis-master 6379"
}

# ─── Main execution ────────────────────────────────────────────────────────

main() {
    log_section "Deploying Databases to Kubernetes"

    # Verify prerequisites
    verify_prerequisites
    echo ""

    # Add Helm repository
    add_helm_repo
    echo ""

    # Deploy databases
    FAILED=()

    if ! deploy_postgres \
        "${POSTGRES_USERS_RELEASE}" \
        "k8s-new/helm/values-db/postgres-users-values.yaml" \
        "PostgreSQL (Users Database)"; then
        FAILED+=("${POSTGRES_USERS_RELEASE}")
    fi
    echo ""

    if ! deploy_postgres \
        "${POSTGRES_TICKETS_RELEASE}" \
        "k8s-new/helm/values-db/postgres-tickets-values.yaml" \
        "PostgreSQL (Tickets Database)"; then
        FAILED+=("${POSTGRES_TICKETS_RELEASE}")
    fi
    echo ""

    if ! deploy_redis \
        "${REDIS_RELEASE}" \
        "k8s-new/helm/values-db/redis-values.yaml" \
        "Redis"; then
        FAILED+=("${REDIS_RELEASE}")
    fi
    echo ""

    if ! deploy_rabbitmq \
        "k8s-new/deployments/rabbitmq.yaml" \
        "RabbitMQ"; then
        FAILED+=("rabbitmq")
    fi
    echo ""

    # Check for failures
    if [ ${#FAILED[@]} -gt 0 ]; then
        log_error "Failed to deploy: ${FAILED[*]}"
        exit 1
    fi

    # Verify and show info
    verify_deployments
    show_connection_info

    log_section "✓ All databases deployed successfully!"
    exit 0
}

# Run main
main "$@"
