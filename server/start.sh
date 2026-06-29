#!/usr/bin/env bash
# Render start script for Onovi API

set -o errexit  # Exit on error

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting Onovi API server..."
node index.js
