#!/bin/bash

# Build script for all Lambda functions
echo "🔨 Building all Lambda functions..."

# Build Auth Lambda
echo "Building Auth Lambda..."
cd ../backend/lambda/auth
rm -rf node_modules
rm -rf dist
npm install
npm run build
cd ../../..

# Build Upload Lambda
echo "Building Upload Lambda..."
cd backend/lambda/upload
rm -rf node_modules
rm -rf dist
npm install
npm run build
cd ../../..

# Build Search Lambda
echo "Building Search Lambda..."
cd backend/lambda/search
rm -rf node_modules
rm -rf dist
npm install
npm run build
cd ../../..

# Build Playback Lambda
echo "Building Playback Lambda..."
cd backend/lambda/playback
rm -rf node_modules
rm -rf dist
npm install
npm run build
cd ../../..

# Build Shared utilities
echo "Building Shared utilities..."
cd backend/shared
rm -rf node_modules
rm -rf dist
npm install
npm run build
cd ../..

echo "✅ All Lambda functions built successfully!"
echo "Ready for CDK deployment."
