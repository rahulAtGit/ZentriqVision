# ZentriqVision Production Deployment Checklist

## Pre-Deployment Checklist ✅

### 1. AWS Account Setup
- [ ] AWS account created and verified
- [ ] IAM user/role with appropriate permissions
- [ ] AWS CLI installed and configured
- [ ] CDK installed and bootstrapped

### 2. Required AWS Permissions
- [ ] CloudFormation (Full access)
- [ ] IAM (Full access)
- [ ] S3 (Full access)
- [ ] Lambda (Full access)
- [ ] API Gateway (Full access)
- [ ] DynamoDB (Full access)
- [ ] Cognito (Full access)
- [ ] SNS (Full access)
- [ ] CloudWatch (Full access)

### 3. Local Environment
- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] TypeScript compiled (`npm run build`)
- [ ] AWS credentials configured

## Deployment Steps 🚀

### Step 1: AWS Configuration
```bash
# Option A: AWS SSO (Recommended)
aws configure sso --profile production

# Option B: AWS Access Keys
aws configure

# Verify configuration
aws sts get-caller-identity
```

### Step 2: CDK Bootstrap
```bash
# Bootstrap CDK in your AWS account/region
npx cdk bootstrap

# Or with specific profile
npx cdk bootstrap --profile production
```

### Step 3: Deploy Infrastructure
```bash
# Deploy the stack
npx cdk deploy

# Or with specific profile
npx cdk deploy --profile production
```

### Step 4: Verify Deployment
```bash
# Run the testing script
./test-deployment.sh

# Check CloudFormation outputs
aws cloudformation describe-stacks --stack-name ZentriqVisionStack
```

## Post-Deployment Tasks 📱

### 1. Update Mobile App Configuration
Update `mobile-app/config/environment.ts` with the deployment outputs:
- API Gateway URL
- User Pool ID
- User Pool Client ID
- S3 Bucket name
- AWS Region

### 2. Test Mobile App Integration
- [ ] Test user registration/login
- [ ] Test video upload
- [ ] Test video search
- [ ] Test video playback

### 3. Set Up Monitoring
- [ ] CloudWatch alarms for Lambda errors
- [ ] S3 bucket monitoring
- [ ] DynamoDB performance monitoring
- [ ] API Gateway metrics

## Production Considerations 🔒

### Security
- [ ] Review IAM policies
- [ ] Enable CloudTrail logging
- [ ] Set up VPC if required
- [ ] Configure CORS properly

### Cost Optimization
- [ ] Set up billing alerts
- [ ] Monitor resource usage
- [ ] Configure S3 lifecycle policies
- [ ] Optimize Lambda memory/timeout

### Performance
- [ ] Set up CloudFront for video delivery
- [ ] Configure DynamoDB auto-scaling
- [ ] Monitor API Gateway latency
- [ ] Set up Lambda concurrency limits

## Troubleshooting 🛠️

### Common Issues
1. **CDK Bootstrap Required**
   ```bash
   npx cdk bootstrap
   ```

2. **Insufficient Permissions**
   - Check IAM policies
   - Verify user/role permissions

3. **Resource Naming Conflicts**
   - Some resources require unique names globally
   - Update resource names if needed

4. **Lambda Function Errors**
   - Check CloudWatch logs
   - Verify environment variables
   - Check IAM permissions

### Useful Commands
```bash
# View stack details
npx cdk diff

# Destroy stack (if needed)
npx cdk destroy

# List stacks
npx cdk list

# Synthesize CloudFormation template
npx cdk synth

# View CloudFormation events
aws cloudformation describe-stack-events --stack-name ZentriqVisionStack
```

## Next Steps After Deployment 🎯

1. **Integration Testing**
   - Test all Lambda functions
   - Verify API Gateway endpoints
   - Test mobile app integration

2. **Monitoring Setup**
   - Set up CloudWatch dashboards
   - Configure alerting
   - Set up log aggregation

3. **CI/CD Pipeline**
   - Set up automated deployments
   - Configure testing pipeline
   - Set up staging environment

4. **Documentation**
   - Update API documentation
   - Create runbooks
   - Document troubleshooting steps

## Support and Resources 📚

- **AWS CDK Documentation**: https://docs.aws.amazon.com/cdk/
- **AWS Lambda Documentation**: https://docs.aws.amazon.com/lambda/
- **AWS API Gateway Documentation**: https://docs.aws.amazon.com/apigateway/
- **AWS Cognito Documentation**: https://docs.aws.amazon.com/cognito/
- **Project Documentation**: See `docs/` folder

---

**Remember**: Always test in a staging environment before deploying to production!
