#!/bin/bash

# Build script for all Lambda functions
echo "🔨 Building all Lambda functions..."

# Build Auth Lambda
echo "Building Auth Lambda..."
cd ../backend/lambda/auth
npm install
npm run build
cd ../../..

# Build Upload Lambda
echo "Building Upload Lambda..."
cd backend/lambda/upload
npm install
npm run build
cd ../../..

# Build Search Lambda
echo "Building Search Lambda..."
cd backend/lambda/search
npm install
npm run build
cd ../../..

# Build Playback Lambda
echo "Building Playback Lambda..."
cd backend/lambda/playback
npm install
npm run build
cd ../../..

# Build Shared utilities
echo "Building Shared utilities..."
cd backend/shared
npm install
npm run build
cd ../..

echo "✅ All Lambda functions built successfully!"
echo "Ready for CDK deployment."
