#!/bin/bash

# ZentriqVision Deployment Testing Script
# This script tests the deployed infrastructure

set -e

echo "🧪 Testing ZentriqVision Infrastructure Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
    else
        echo -e "${YELLOW}⚠️  INFO${NC}: $message"
    fi
}

# Check if AWS is configured
echo ""
echo "🔍 Checking AWS configuration..."
if aws sts get-caller-identity &> /dev/null; then
    print_status "PASS" "AWS configuration verified"
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    REGION=$(aws configure get region)
    echo "   Account: $ACCOUNT_ID"
    echo "   Region: $REGION"
else
    print_status "FAIL" "AWS configuration failed"
    exit 1
fi

# Get stack outputs
echo ""
echo "📋 Getting stack outputs..."
if ! STACK_OUTPUTS=$(aws cloudformation describe-stacks --stack-name ZentriqVisionStack --query 'Stacks[0].Outputs' --output json 2>/dev/null); then
    print_status "FAIL" "Stack not found or not accessible"
    exit 1
fi

print_status "PASS" "Stack outputs retrieved"

# Extract values from stack outputs
API_URL=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiGatewayUrl") | .OutputValue')
USER_POOL_ID=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="UserPoolId") | .OutputValue')
USER_POOL_CLIENT_ID=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="UserPoolClientId") | .OutputValue')
VIDEO_BUCKET=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="VideoBucketName") | .OutputValue')
DATA_TABLE=$(echo "$STACK_OUTPUTS" | jq -r '.[] | select(.OutputKey=="DataTableName") | .OutputValue')

echo "   API Gateway URL: $API_URL"
echo "   User Pool ID: $USER_POOL_ID"
echo "   User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "   Video Bucket: $VIDEO_BUCKET"
echo "   Data Table: $DATA_TABLE"

# Test 1: API Gateway Health Check
echo ""
echo "🌐 Testing API Gateway..."
if [ "$API_URL" != "null" ] && [ "$API_URL" != "" ]; then
    if curl -s -f "$API_URL" > /dev/null 2>&1; then
        print_status "PASS" "API Gateway is accessible"
    else
        print_status "FAIL" "API Gateway is not accessible"
    fi
else
    print_status "FAIL" "API Gateway URL not found in stack outputs"
fi

# Test 2: S3 Bucket Access
echo ""
echo "🪣 Testing S3 Bucket..."
if [ "$VIDEO_BUCKET" != "null" ] && [ "$VIDEO_BUCKET" != "" ]; then
    if aws s3 ls "s3://$VIDEO_BUCKET" > /dev/null 2>&1; then
        print_status "PASS" "S3 bucket is accessible"
    else
        print_status "FAIL" "S3 bucket is not accessible"
    fi
else
    print_status "FAIL" "S3 bucket name not found in stack outputs"
fi

# Test 3: DynamoDB Table Access
echo ""
echo "🗄️  Testing DynamoDB Table..."
if [ "$DATA_TABLE" != "null" ] && [ "$DATA_TABLE" != "" ]; then
    if aws dynamodb describe-table --table-name "$DATA_TABLE" > /dev/null 2>&1; then
        print_status "PASS" "DynamoDB table is accessible"
    else
        print_status "FAIL" "DynamoDB table is not accessible"
    fi
else
    print_status "FAIL" "DynamoDB table name not found in stack outputs"
fi

# Test 4: Cognito User Pool
echo ""
echo "👥 Testing Cognito User Pool..."
if [ "$USER_POOL_ID" != "null" ] && [ "$USER_POOL_ID" != "" ]; then
    if aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" > /dev/null 2>&1; then
        print_status "PASS" "Cognito User Pool is accessible"
    else
        print_status "FAIL" "Cognito User Pool is not accessible"
    fi
else
    print_status "FAIL" "User Pool ID not found in stack outputs"
fi

# Test 5: Lambda Functions
echo ""
echo "⚡ Testing Lambda Functions..."
LAMBDA_FUNCTIONS=("UploadLambda" "SearchLambda" "ProcessingLambda")

for func in "${LAMBDA_FUNCTIONS[@]}"; do
    if aws lambda get-function --function-name "$func" > /dev/null 2>&1; then
        print_status "PASS" "Lambda function $func is accessible"
    else
        print_status "FAIL" "Lambda function $func is not accessible"
    fi
done

# Test 6: API Endpoints
echo ""
echo "🔗 Testing API Endpoints..."
if [ "$API_URL" != "null" ] && [ "$API_URL" != "" ]; then
    # Test upload endpoint
    if curl -s -f -X POST "$API_URL/upload" -H "Content-Type: application/json" -d '{"test": "data"}' > /dev/null 2>&1; then
        print_status "PASS" "Upload endpoint is accessible"
    else
        print_status "FAIL" "Upload endpoint is not accessible"
    fi
    
    # Test search endpoint
    if curl -s -f "$API_URL/search" > /dev/null 2>&1; then
        print_status "PASS" "Search endpoint is accessible"
    else
        print_status "FAIL" "Search endpoint is not accessible"
    fi
else
    print_status "FAIL" "Cannot test endpoints - API URL not available"
fi

# Generate mobile app configuration
echo ""
echo "📱 Generating Mobile App Configuration..."
if [ "$API_URL" != "null" ] && [ "$USER_POOL_ID" != "null" ] && [ "$USER_POOL_CLIENT_ID" != "null" ] && [ "$VIDEO_BUCKET" != "null" ]; then
    cat > mobile-app-config.ts << EOF
// Generated configuration for ZentriqVision mobile app
// Update this in mobile-app/config/environment.ts

export const productionConfig = {
  apiUrl: "$API_URL",
  environment: "production" as const,
  userPoolId: "$USER_POOL_ID",
  userPoolClientId: "$USER_POOL_CLIENT_ID",
  region: "$REGION",
  videoBucket: "$VIDEO_BUCKET"
};
EOF
    print_status "PASS" "Mobile app configuration generated in mobile-app-config.ts"
else
    print_status "FAIL" "Cannot generate configuration - missing required values"
fi

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="
echo "All tests completed. Check the results above."
echo ""
echo "Next steps:"
echo "1. Update mobile app configuration with the generated values"
echo "2. Test mobile app integration"
echo "3. Set up monitoring and alerting"
echo "4. Configure CI/CD pipeline"
echo ""
echo "For troubleshooting, check CloudWatch logs and CloudFormation events."
