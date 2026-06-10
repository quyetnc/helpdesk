#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# Build and Push Docker Images to AWS ECR
# ═══════════════════════════════════════════════════════════════════════════
# Usage: ./build-and-push-images.sh
# Purpose: Build all microservices, tag with git commit SHA, push to ECR
# ═══════════════════════════════════════════════════════════════════════════

set -o pipefail

# ─── Configuration ──────────────────────────────────────────────────────────
AWS_ACCOUNT_ID="905418181527"
AWS_REGION="ap-northeast-1"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

SERVICES=(
    "api-gateway"
    "user-service"
    "ticket-service"
    "notification-service"
    "frontend"
)

# ─── Colors for output ──────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Verify prerequisites
verify_prerequisites() {
    log_info "Verifying prerequisites..."

    # Check git
    if ! command -v git &> /dev/null; then
        log_error "git is not installed"
        exit 1
    fi

    # Check docker
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed"
        exit 1
    fi

    # Check aws cli
    if ! command -v aws &> /dev/null; then
        log_error "aws cli is not installed"
        exit 1
    fi

    # Verify docker daemon is running
    if ! docker ps &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi

    log_success "All prerequisites verified"
}

# Get git commit SHA
get_commit_sha() {
    if ! git rev-parse --short HEAD &> /dev/null; then
        log_error "Not in a git repository"
        exit 1
    fi
    git rev-parse --short HEAD
}

# Login to ECR
login_to_ecr() {
    log_info "Logging in to ECR at ${ECR_REGISTRY}..."

    if ! aws ecr get-login-password --region "${AWS_REGION}" | \
        docker login --username AWS --password-stdin "${ECR_REGISTRY}" &> /dev/null; then
        log_error "Failed to login to ECR. Check AWS credentials and permissions."
        exit 1
    fi

    log_success "Successfully logged in to ECR"
}

# Build Docker image
build_image() {
    local service=$1
    local commit_sha=$2
    local image_uri="${ECR_REGISTRY}/${service}:${commit_sha}"

    log_info "Building image for ${service}..."

    if [ ! -d "${service}" ]; then
        log_error "Service directory '${service}' not found"
        return 1
    fi

    if [ ! -f "${service}/Dockerfile" ]; then
        log_error "Dockerfile not found in ${service}/"
        return 1
    fi

    if ! docker build -t "${image_uri}" "./${service}" > /dev/null 2>&1; then
        log_error "Failed to build image for ${service}"
        return 1
    fi

    log_success "Built image: ${image_uri}"
}

# Push Docker image to ECR
push_image() {
    local image_uri=$1
    local service=$2

    log_info "Pushing ${service} to ECR..."

    if ! docker push "${image_uri}"; then
        log_error "Failed to push ${image_uri}"
        return 1
    fi

    log_success "Pushed ${image_uri}"
}

# ─── Main execution ────────────────────────────────────────────────────────

main() {
    log_info "Starting Docker image build and push process..."
    echo ""

    # Verify all prerequisites
    verify_prerequisites
    echo ""

    # Get commit SHA
    COMMIT_SHA=$(get_commit_sha)
    log_success "Using commit SHA: ${COMMIT_SHA}"
    echo ""

    # Login to ECR
    login_to_ecr
    echo ""

    # Build and push each service
    FAILED_SERVICES=()
    PUSHED_IMAGES=()

    for service in "${SERVICES[@]}"; do
        log_info "Processing ${service}..."

        if ! build_image "${service}" "${COMMIT_SHA}"; then
            FAILED_SERVICES+=("${service}")
            continue
        fi

        image_uri="${ECR_REGISTRY}/${service}:${COMMIT_SHA}"

        if ! push_image "${image_uri}" "${service}"; then
            FAILED_SERVICES+=("${service}")
            continue
        fi

        PUSHED_IMAGES+=("${image_uri}")
        echo ""
    done

    # Summary
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "Build and push complete!"
    echo ""
    echo "Images pushed (${#PUSHED_IMAGES[@]}/${#SERVICES[@]}):"
    for img in "${PUSHED_IMAGES[@]}"; do
        echo "  ✓ ${img}"
    done

    if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
        echo ""
        log_warning "Failed services (${#FAILED_SERVICES[@]}):"
        for svc in "${FAILED_SERVICES[@]}"; do
            echo "  ✗ ${svc}"
        done
        exit 1
    fi

    echo ""
    log_success "All images built and pushed successfully!"
    log_info "Tag: ${COMMIT_SHA}"
    log_info "Registry: ${ECR_REGISTRY}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
}

# Run main
main "$@"
