#!/bin/bash

# ZentriqVision AWS Setup Script
# This script helps set up AWS configuration and deploy the infrastructure

set -e

echo "🚀 ZentriqVision AWS Infrastructure Setup"
echo "=========================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Function to configure AWS SSO
setup_aws_sso() {
    echo ""
    echo "🔐 Setting up AWS SSO..."
    read -p "Enter SSO start URL: " sso_start_url
    read -p "Enter SSO region: " sso_region
    read -p "Enter AWS Account ID: " account_id
    read -p "Enter Role Name: " role_name
    read -p "Enter Profile Name (default: production): " profile_name
    
    profile_name=${profile_name:-production}
    
    aws configure sso --profile "$profile_name" \
        --sso-start-url "$sso_start_url" \
        --sso-region "$sso_region" \
        --account-id "$account_id" \
        --role-name "$role_name"
    
    echo "✅ AWS SSO configured with profile: $profile_name"
    export AWS_PROFILE="$profile_name"
}

# Function to configure AWS Access Keys
setup_aws_keys() {
    echo ""
    echo "🔑 Setting up AWS Access Keys..."
    aws configure
    echo "✅ AWS Access Keys configured"
}

# Function to bootstrap CDK
bootstrap_cdk() {
    echo ""
    echo "🔧 Bootstrapping CDK..."
    if [ -n "$AWS_PROFILE" ]; then
        npx cdk bootstrap --profile "$AWS_PROFILE"
    else
        npx cdk bootstrap
    fi
    echo "✅ CDK bootstrapped successfully"
}

# Function to deploy infrastructure
deploy_infrastructure() {
    echo ""
    echo "🚀 Deploying infrastructure..."
    if [ -n "$AWS_PROFILE" ]; then
        npx cdk deploy --profile "$AWS_PROFILE"
    else
        npx cdk deploy
    fi
    echo "✅ Infrastructure deployed successfully"
}

# Main setup flow
echo ""
echo "Choose your AWS configuration method:"
echo "1) AWS SSO (Recommended for production)"
echo "2) AWS Access Keys (Quick setup for testing)"
echo "3) Skip AWS config (already configured)"

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        setup_aws_sso
        ;;
    2)
        setup_aws_keys
        ;;
    3)
        echo "⏭️  Skipping AWS configuration"
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

# Check if AWS is configured
echo ""
echo "🔍 Verifying AWS configuration..."
if aws sts get-caller-identity &> /dev/null; then
    echo "✅ AWS configuration verified"
    echo "Account: $(aws sts get-caller-identity --query Account --output text)"
    echo "Region: $(aws configure get region)"
else
    echo "❌ AWS configuration failed. Please check your setup."
    exit 1
fi

# Install dependencies and build
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building TypeScript..."
npm run build

# Ask if user wants to bootstrap CDK
echo ""
read -p "Do you want to bootstrap CDK now? (y/n): " bootstrap_choice
if [[ $bootstrap_choice =~ ^[Yy]$ ]]; then
    bootstrap_cdk
fi

# Ask if user wants to deploy
echo ""
read -p "Do you want to deploy the infrastructure now? (y/n): " deploy_choice
if [[ $deploy_choice =~ ^[Yy]$ ]]; then
    deploy_infrastructure
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update mobile app configuration with deployment outputs"
echo "2. Test the deployed infrastructure"
echo "3. Run the mobile app against production services"
echo ""
echo "For more details, see DEPLOYMENT.md"
