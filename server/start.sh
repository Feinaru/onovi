#!/usr/bin/env bash
# Render start script for Lomea API

set -o errexit  # Exit on error

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting Lomea API server..."
node index.js
