#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
REPOSITORIES=(
  "api-gateway"
  "user-service"
  "ticket-service"
  "notification-service"
  "frontend"
)

log_info() {
  echo -e "${BLUE}ℹ ${1}${NC}"
}

log_success() {
  echo -e "${GREEN}✓ ${1}${NC}"
}

log_error() {
  echo -e "${RED}✗ ${1}${NC}"
}

# Verify AWS CLI is installed
if ! command -v aws &> /dev/null; then
  log_error "AWS CLI is not installed"
  exit 1
fi

log_info "Deleting all images from ECR repositories in region: $AWS_REGION"

for repo in "${REPOSITORIES[@]}"; do
  log_info "Processing repository: $repo"

  # Get all image digests in the repository
  image_digests=$(aws ecr list-images \
    --repository-name "$repo" \
    --region "$AWS_REGION" \
    --query 'imageIds[*].imageDigest' \
    --output text 2>/dev/null || true)

  if [ -z "$image_digests" ]; then
    log_success "$repo: No images found"
    continue
  fi

  # Convert to array
  digests_array=($image_digests)
  total_images=${#digests_array[@]}

  log_info "$repo: Found $total_images images, deleting..."

  # Delete images in batches (max 100 per API call)
  batch_size=100
  for ((i=0; i<total_images; i+=batch_size)); do
    batch_digests=("${digests_array[@]:i:batch_size}")
    image_ids=""

    for digest in "${batch_digests[@]}"; do
      image_ids="${image_ids}imageDigest=${digest} "
    done

    aws ecr batch-delete-image \
      --repository-name "$repo" \
      --region "$AWS_REGION" \
      --image-ids $image_ids \
      > /dev/null 2>&1
  done

  log_success "$repo: Deleted all $total_images images"
done

log_success "All ECR images deleted successfully!"
log_info "You can now run: terraform destroy -auto-approve"
