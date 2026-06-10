#!/bin/bash
set -e

# API Gateway does not use a database, so no migration needed
echo "Starting API Gateway..."
node src/index.js
