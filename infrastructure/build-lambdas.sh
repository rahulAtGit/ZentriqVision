#!/bin/bash

# Build script for all Lambda functions
echo "🔨 Building and bundling all Lambda functions..."

# Build Auth Lambda
echo "Building and bundling Auth Lambda..."
cd ../backend/lambda/auth
rm -rf node_modules
rm -rf dist
npm install
npm run build
npm run bundle
cd ../../..

# Build Upload Lambda
echo "Building and bundling Upload Lambda..."
cd backend/lambda/upload
rm -rf node_modules
rm -rf dist
npm install
npm run build
npm run bundle
cd ../../..

# Build Search Lambda
echo "Building and bundling Search Lambda..."
cd backend/lambda/search
rm -rf node_modules
rm -rf dist
npm install
npm run build
npm run bundle
cd ../../..

# Build Playback Lambda
echo "Building and bundling Playback Lambda..."
cd backend/lambda/playback
rm -rf node_modules
rm -rf dist
npm install
npm run build
npm run bundle
cd ../../..

# Build User Lambda
echo "Building and bundling User Lambda..."
cd backend/lambda/user
rm -rf node_modules
rm -rf dist
npm install
npm run build
npm run bundle
cd ../../..

# Build Shared utilities
echo "Building Shared utilities..."
cd backend/shared
rm -rf node_modules
rm -rf dist
npm install
npm run build
cd ../..

echo "✅ All Lambda functions built and bundled successfully!"
echo "Ready for CDK deployment."
