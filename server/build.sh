#!/usr/bin/env bash
# Render build script for Onovi API

set -o errexit  # Exit on error

echo "Installing dependencies..."
npm install

echo "Generating Prisma Client..."
npx prisma generate

echo "Build completed successfully!"
