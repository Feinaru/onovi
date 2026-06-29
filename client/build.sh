#!/usr/bin/env bash
# Render build script for Onovi Client

set -o errexit  # Exit on error

echo "Installing dependencies..."
npm install

echo "Building client application..."
npm run build

echo "Build completed successfully!"
echo "Static files are in ./dist/"
