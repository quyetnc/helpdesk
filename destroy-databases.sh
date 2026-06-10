#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# Destroy Databases from Kubernetes (PostgreSQL + Redis + RabbitMQ)
# ═══════════════════════════════════════════════════════════════════════════
# Usage: ./destroy-databases.sh
# Purpose: Uninstall PostgreSQL, Redis via Helm, and RabbitMQ via kubectl
# WARNING: This will delete all databases and data!
# ═══════════════════════════════════════════════════════════════════════════

# ─── Configuration ──────────────────────────────────────────────────────────
NAMESPACE="default"

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

    log_success "All prerequisites verified"
}

# Confirm deletion
confirm_deletion() {
    echo ""
    log_warning "⚠️  This will DELETE all databases and data!"
    echo "Releases to delete:"
    echo "  - ${POSTGRES_USERS_RELEASE}"
    echo "  - ${POSTGRES_TICKETS_RELEASE}"
    echo "  - ${REDIS_RELEASE}"
    echo "  - rabbitmq"
    echo ""
    read -p "Type 'yes' to confirm deletion: " confirmation
    if [ "$confirmation" != "yes" ]; then
        log_info "Cancelled."
        exit 0
    fi
}

# Destroy PostgreSQL
destroy_postgres() {
    local release=$1

    log_info "Uninstalling ${release}..."

    if helm list -n "${NAMESPACE}" | grep -q "^${release}\s"; then
        if ! helm uninstall "${release}" -n "${NAMESPACE}" --wait; then
            log_error "Failed to uninstall ${release}"
            return 1
        fi
        log_success "Uninstalled: ${release}"
    else
        log_info "Release ${release} not found (already deleted?)"
    fi
}

# Destroy Redis
destroy_redis() {
    local release=$1

    log_info "Uninstalling ${release}..."

    if helm list -n "${NAMESPACE}" | grep -q "^${release}\s"; then
        if ! helm uninstall "${release}" -n "${NAMESPACE}" --wait; then
            log_error "Failed to uninstall ${release}"
            return 1
        fi
        log_success "Uninstalled: ${release}"
    else
        log_info "Release ${release} not found (already deleted?)"
    fi
}

# Destroy RabbitMQ
destroy_rabbitmq() {
    log_info "Deleting RabbitMQ StatefulSet, Service, and ConfigMap..."

    # Delete StatefulSet
    if kubectl get statefulset rabbitmq -n "${NAMESPACE}" &> /dev/null; then
        kubectl delete statefulset rabbitmq -n "${NAMESPACE}" --wait=true
    fi

    # Delete Service
    if kubectl get service rabbitmq -n "${NAMESPACE}" &> /dev/null; then
        kubectl delete service rabbitmq -n "${NAMESPACE}"
    fi

    # Delete ConfigMap
    if kubectl get configmap rabbitmq-config -n "${NAMESPACE}" &> /dev/null; then
        kubectl delete configmap rabbitmq-config -n "${NAMESPACE}"
    fi

    # Delete Secret (optional)
    if kubectl get secret rabbitmq-secret -n "${NAMESPACE}" &> /dev/null; then
        log_info "Deleting rabbitmq-secret..."
        kubectl delete secret rabbitmq-secret -n "${NAMESPACE}"
    fi

    log_success "Deleted: RabbitMQ"
}

# Clean up PVCs (optional)
cleanup_pvcs() {
    log_info "Cleaning up Persistent Volume Claims..."

    # Get all PVCs related to databases
    PVCs=$(kubectl get pvc -n "${NAMESPACE}" -o name | grep -E "(postgres|redis|rabbitmq)" || true)

    if [ -z "$PVCs" ]; then
        log_info "No PVCs found to clean up"
        return 0
    fi

    echo "PVCs to delete:"
    echo "$PVCs"
    echo ""
    read -p "Delete these PVCs? (yes/no): " pvc_confirm
    if [ "$pvc_confirm" = "yes" ]; then
        echo "$PVCs" | xargs -I {} kubectl delete {} -n "${NAMESPACE}"
        log_success "Deleted PVCs"
    else
        log_info "Skipped PVC deletion"
    fi
}

# ─── Main execution ────────────────────────────────────────────────────────

main() {
    log_section "Destroying Databases from Kubernetes"

    # Verify prerequisites
    verify_prerequisites
    echo ""

    # Confirm deletion
    confirm_deletion
    echo ""

    # Destroy resources
    destroy_postgres "${POSTGRES_USERS_RELEASE}"
    echo ""

    destroy_postgres "${POSTGRES_TICKETS_RELEASE}"
    echo ""

    destroy_redis "${REDIS_RELEASE}"
    echo ""

    destroy_rabbitmq
    echo ""

    # Optional PVC cleanup
    cleanup_pvcs
    echo ""

    log_section "✓ All databases destroyed successfully!"
    exit 0
}

# Run main
main "$@"
