#!/usr/bin/env python3
"""
Test script for video processing pipeline
This script simulates an S3 event to test our Processing Lambda directly
"""

import boto3
import json
import os
from datetime import datetime

def test_video_processing_pipeline():
    """Test the complete video processing pipeline"""
    
    print("🎬 Testing Video Processing Pipeline")
    print("=" * 50)
    
    # Initialize AWS clients
    lambda_client = boto3.client('lambda')
    s3 = boto3.client('s3')
    dynamodb = boto3.resource('dynamodb')
    
    try:
        # Test 1: Check if we can access the Processing Lambda
        print("\n1️⃣ Testing Processing Lambda access...")
        
        # Get the Lambda function name from our stack
        lambda_name = "ZentriqVisionStack-ProcessingLambda0A3B4A63-R6EnFC1fe0jm"
        
        try:
            response = lambda_client.get_function(FunctionName=lambda_name)
            print(f"✅ Processing Lambda accessible: {lambda_name}")
        except Exception as e:
            print(f"❌ Processing Lambda access error: {e}")
            return False
        
        # Test 2: Create a test S3 event
        print("\n2️⃣ Creating test S3 event...")
        
        # Simulate an S3 event for video upload
        test_event = {
            "Records": [
                {
                    "eventVersion": "2.1",
                    "eventSource": "aws:s3",
                    "awsRegion": "us-east-1",
                    "eventTime": datetime.utcnow().isoformat(),
                    "eventName": "ObjectCreated:Put",
                    "s3": {
                        "s3SchemaVersion": "1.0",
                        "configurationId": "test-config",
                        "bucket": {
                            "name": "zentriqvisionstack-zentriqvisionvideobucket68f2b96-b9xomlqxcw93",
                            "ownerIdentity": {
                                "principalId": "test"
                            },
                            "arn": "arn:aws:s3:::zentriqvisionstack-zentriqvisionvideobucket68f2b96-b9xomlqxcw93"
                        },
                        "object": {
                            "key": "test-org/videos/test-video-001.mp4",
                            "size": 1024000,
                            "eTag": "test-etag",
                            "sequencer": "0"
                        }
                    }
                }
            ]
        }
        
        print("✅ Test S3 event created")
        print(f"   Bucket: {test_event['Records'][0]['s3']['bucket']['name']}")
        print(f"   Key: {test_event['Records'][0]['s3']['object']['key']}")
        
        # Test 3: Invoke Processing Lambda with test event
        print("\n3️⃣ Invoking Processing Lambda...")
        
        try:
            response = lambda_client.invoke(
                FunctionName=lambda_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(test_event)
            )
            
            print("✅ Processing Lambda invoked successfully")
            
            # Parse response
            response_payload = json.loads(response['Payload'].read())
            print(f"   Status Code: {response['StatusCode']}")
            print(f"   Response: {json.dumps(response_payload, indent=2)}")
            
            if response['StatusCode'] == 200:
                print("🎉 Processing Lambda executed successfully!")
                return True
            else:
                print("❌ Processing Lambda execution failed")
                return False
                
        except Exception as e:
            print(f"❌ Processing Lambda invocation error: {e}")
            return False
        
    except Exception as e:
        print(f"❌ Video processing pipeline test failed: {e}")
        return False

def test_dynamodb_updates():
    """Test if DynamoDB is being updated by the Processing Lambda"""
    
    print("\n🗄️ Testing DynamoDB Updates")
    print("=" * 40)
    
    try:
        dynamodb = boto3.resource('dynamodb')
        table_name = "zentriqvision-data"
        
        print(f"1️⃣ Checking DynamoDB table: {table_name}")
        
        table = dynamodb.Table(table_name)
        
        # Check if our test video entry exists
        try:
            response = table.get_item(
                Key={
                    'PK': 'ORG#test-org',
                    'SK': 'VIDEO#test-video-001'
                }
            )
            
            if 'Item' in response:
                item = response['Item']
                print("✅ Test video entry found in DynamoDB")
                print(f"   Status: {item.get('status', 'N/A')}")
                print(f"   Processing Started: {item.get('processingStartedAt', 'N/A')}")
                print(f"   MediaConvert Job ID: {item.get('mediaConvertJobId', 'N/A')}")
                print(f"   Thumbnail Status: {item.get('thumbnailStatus', 'N/A')}")
                return True
            else:
                print("ℹ️ Test video entry not found yet (may be processing)")
                return False
                
        except Exception as e:
            print(f"❌ DynamoDB query error: {e}")
            return False
            
    except Exception as e:
        print(f"❌ DynamoDB test failed: {e}")
        return False

def test_mediaconvert_jobs():
    """Test if MediaConvert jobs are being created"""
    
    print("\n🎥 Testing MediaConvert Jobs")
    print("=" * 40)
    
    try:
        mediaconvert = boto3.client('mediaconvert')
        
        print("1️⃣ Checking recent MediaConvert jobs...")
        
        # List recent jobs
        response = mediaconvert.list_jobs(MaxResults=10)
        
        if 'Jobs' in response:
            jobs = response['Jobs']
            print(f"✅ Found {len(jobs)} recent MediaConvert jobs")
            
            # Look for our test job
            test_jobs = [job for job in jobs if 'test-video-001' in str(job.get('UserMetadata', {}))]
            
            if test_jobs:
                print("🎉 Found MediaConvert job for our test video!")
                for job in test_jobs:
                    print(f"   Job ID: {job.get('Id', 'N/A')}")
                    print(f"   Status: {job.get('Status', 'N/A')}")
                    print(f"   Created: {job.get('CreatedAt', 'N/A')}")
                return True
            else:
                print("ℹ️ No MediaConvert jobs found for test video yet")
                return False
        else:
            print("ℹ️ No recent MediaConvert jobs found")
            return False
            
    except Exception as e:
        print(f"❌ MediaConvert jobs test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Video Processing Pipeline Tests")
    print("=" * 60)
    
    # Test the main processing pipeline
    pipeline_success = test_video_processing_pipeline()
    
    # Wait a moment for processing to complete
    if pipeline_success:
        print("\n⏳ Waiting for processing to complete...")
        import time
        time.sleep(10)  # Wait 10 seconds
        
        # Test DynamoDB updates
        dynamodb_success = test_dynamodb_updates()
        
        # Test MediaConvert jobs
        mediaconvert_success = test_mediaconvert_jobs()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 Test Summary")
        print("=" * 60)
        
        if pipeline_success and dynamodb_success and mediaconvert_success:
            print("🎉 ALL TESTS PASSED!")
            print("✅ Video processing pipeline working")
            print("✅ DynamoDB updates working")
            print("✅ MediaConvert integration working")
            print("\n🚀 Ready for production video processing!")
        else:
            print("❌ SOME TESTS FAILED")
            if not pipeline_success:
                print("❌ Video processing pipeline needs attention")
            if not dynamodb_success:
                print("❌ DynamoDB updates need attention")
            if not mediaconvert_success:
                print("❌ MediaConvert integration needs attention")
    else:
        print("\n❌ Pipeline test failed - cannot proceed with other tests")
    
    print("\n" + "=" * 60)
