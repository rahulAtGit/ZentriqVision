# ZentriqVision Infrastructure Deployment Guide

## Prerequisites

1. **AWS CLI** - Version 2.x installed and configured
2. **Node.js** - Version 18+ installed
3. **AWS Account** - With appropriate permissions for:
   - CloudFormation
   - IAM
   - S3
   - Lambda
   - API Gateway
   - DynamoDB
   - Cognito
   - SNS

## Step 1: AWS Configuration

### Option A: AWS SSO (Recommended for Production)

```bash
# Configure SSO profile
aws configure sso --profile production

# SSO Configuration Details:
# SSO start URL: [Your SSO Portal URL]
# SSO Region: [Your SSO Region]
# Account ID: [Your AWS Account ID]
# Role Name: [Your Role Name]
# Profile Name: production
```

### Option B: AWS Access Keys (Quick Setup)

```bash
# Configure access keys
aws configure

# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

## Step 2: CDK Bootstrap

Before deploying, bootstrap your AWS environment:

```bash
# Bootstrap CDK in your AWS account/region
npx cdk bootstrap

# Or with specific profile
npx cdk bootstrap --profile production
```

## Step 3: Environment Configuration

Update the environment configuration in `mobile-app/config/environment.ts` with your actual values after deployment.

## Step 4: Deploy Infrastructure

```bash
# Deploy the stack
npx cdk deploy

# Or with specific profile
npx cdk deploy --profile production
```

## Step 5: Update Mobile App Configuration

After deployment, update these environment variables in your mobile app:

```typescript
// Update these values in mobile-app/config/environment.ts
export const env = {
  apiUrl:
    "https://[YOUR-API-GATEWAY-ID].execute-api.[REGION].amazonaws.com/prod",
  userPoolId: "[YOUR-USER-POOL-ID]",
  userPoolClientId: "[YOUR-USER-POOL-CLIENT-ID]",
  region: "[YOUR-AWS-REGION]",
  videoBucket: "[YOUR-S3-BUCKET-NAME]",
};
```

## Step 6: Test Deployment

1. **Test API Gateway endpoints**
2. **Test Cognito authentication**
3. **Test S3 upload/download**
4. **Test Lambda functions**

## Troubleshooting

### Common Issues:

1. **CDK Bootstrap Required**

   ```bash
   npx cdk bootstrap
   ```

2. **Insufficient Permissions**

   - Ensure your AWS user/role has necessary permissions
   - Check IAM policies

3. **Resource Naming Conflicts**
   - Some resources require unique names globally
   - Update resource names in `infrastructure-stack.ts` if needed

### Useful Commands:

```bash
# View stack details
npx cdk diff

# Destroy stack (if needed)
npx cdk destroy

# List stacks
npx cdk list

# Synthesize CloudFormation template
npx cdk synth
```

## Production Considerations

1. **Environment Separation**: Use different AWS accounts/profiles for dev/staging/prod
2. **Monitoring**: Set up CloudWatch alarms and logging
3. **Security**: Review IAM policies and security groups
4. **Cost Optimization**: Monitor resource usage and costs
5. **Backup**: Ensure DynamoDB point-in-time recovery is enabled

## Next Steps After Deployment

1. **Test all Lambda functions**
2. **Verify API Gateway endpoints**
3. **Test mobile app integration**
4. **Set up monitoring and alerting**
5. **Configure CI/CD pipeline**
