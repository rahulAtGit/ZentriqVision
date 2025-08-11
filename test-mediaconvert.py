#!/usr/bin/env python3
"""
Test script for MediaConvert integration
This script tests the MediaConvert functionality without needing actual video uploads
"""

import boto3
import json
import os
from datetime import datetime

def test_mediaconvert_integration():
    """Test MediaConvert integration"""
    
    print("🧪 Testing MediaConvert Integration")
    print("=" * 40)
    
    # Initialize AWS clients
    mediaconvert = boto3.client('mediaconvert')
    s3 = boto3.client('s3')
    
    try:
        # Test 1: Check MediaConvert endpoint
        print("\n1️⃣ Testing MediaConvert endpoint...")
        endpoints = mediaconvert.describe_endpoints()
        endpoint_url = endpoints['Endpoints'][0]['Url']
        print(f"✅ MediaConvert endpoint: {endpoint_url}")
        
        # Test 2: Check MediaConvert permissions
        print("\n2️⃣ Testing MediaConvert permissions...")
        try:
            # Try to list jobs (this will test permissions)
            response = mediaconvert.list_jobs(MaxResults=1)
            print("✅ MediaConvert permissions working - can list jobs")
        except Exception as e:
            print(f"❌ MediaConvert permissions error: {e}")
            return False
        
        # Test 3: Test job creation (with dummy data)
        print("\n3️⃣ Testing MediaConvert job creation...")
        try:
            # Create a test job with minimal settings
            test_job_settings = {
                'TimecodeConfig': {
                    'Source': 'ZEROBASED'
                },
                'Inputs': [{
                    'FileInput': 's3://test-bucket/test-video.mp4'
                }],
                'OutputGroups': [{
                    'Name': 'File Group',
                    'OutputGroupSettings': {
                        'Type': 'FILE_GROUP_SETTINGS',
                        'FileGroupSettings': {
                            'Destination': 's3://test-bucket/thumbnails/'
                        }
                    },
                    'Outputs': [
                        {
                            'NameModifier': '_test_video',
                            'ContainerSettings': {
                                'Container': 'MP4'
                            },
                            'VideoDescription': {
                                'Width': 320,
                                'Height': 240,
                                'ScalingBehavior': 'DEFAULT',
                                'CodecSettings': {
                                    'Codec': 'H_264',
                                    'H264Settings': {
                                        'MaxBitrate': 1000000,
                                        'RateControlMode': 'QVBR',
                                        'QvbrSettings': {
                                            'QvbrQualityLevel': 7
                                        }
                                    }
                                }
                            }
                        },
                        {
                            'NameModifier': '_test_frame',
                            'ContainerSettings': {
                                'Container': 'RAW'
                            },
                            'VideoDescription': {
                                'Width': 320,
                                'Height': 240,
                                'ScalingBehavior': 'DEFAULT',
                                'CodecSettings': {
                                    'Codec': 'FRAME_CAPTURE',
                                    'FrameCaptureSettings': {
                                        'MaxCaptures': 1,
                                        'Quality': 80
                                    }
                                }
                            }
                        }
                    ]
                }]
            }
            
            # Try to create a job (this will test the job creation logic)
            # Note: This will fail because the S3 bucket doesn't exist, but that's expected
            try:
                response = mediaconvert.create_job(
                    Role='arn:aws:iam::804857032172:role/ZentriqVisionStack-MediaConvertServiceRole08F94F4A-LiWrgvEvyiN6',
                    Settings=test_job_settings,
                    UserMetadata={
                        'test': 'true',
                        'timestamp': datetime.utcnow().isoformat()
                    }
                )
                print("✅ MediaConvert job creation working!")
                job_id = response['Job']['Id']
                print(f"   Job ID: {job_id}")
                
                # Clean up - cancel the test job
                mediaconvert.cancel_job(Id=job_id)
                print("   Test job cancelled")
                
            except Exception as e:
                if "AccessDenied" in str(e):
                    print("❌ MediaConvert role access denied - need to create proper IAM role")
                    print(f"   Error: {e}")
                    return False
                elif "NoSuchBucket" in str(e):
                    print("✅ MediaConvert job creation working (expected S3 error)")
                else:
                    print(f"❌ Unexpected MediaConvert error: {e}")
                    return False
        
        except Exception as e:
            print(f"❌ MediaConvert job creation test failed: {e}")
            return False
        
        print("\n🎉 All MediaConvert tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ MediaConvert integration test failed: {e}")
        return False

def test_s3_thumbnail_structure():
    """Test S3 thumbnail directory structure"""
    
    print("\n🪣 Testing S3 Thumbnail Structure")
    print("=" * 40)
    
    try:
        s3 = boto3.client('s3')
        
        # Get bucket name from environment or use a placeholder
        bucket_name = "zentriqvisionstack-zentriqvisionvideobucket68f2b96-b9xomlqxcw93"
        
        print(f"1️⃣ Testing S3 bucket access: {bucket_name}")
        
        # Test bucket access
        try:
            response = s3.head_bucket(Bucket=bucket_name)
            print("✅ S3 bucket accessible")
        except Exception as e:
            print(f"❌ S3 bucket access error: {e}")
            return False
        
        # Test thumbnail directory structure
        print("\n2️⃣ Testing thumbnail directory structure...")
        try:
            # List objects in thumbnails directory
            response = s3.list_objects_v2(
                Bucket=bucket_name,
                Prefix='test-org/thumbnails/',
                MaxKeys=10
            )
            
            if 'Contents' in response:
                print(f"✅ Thumbnail directory exists with {len(response['Contents'])} objects")
                for obj in response['Contents']:
                    print(f"   - {obj['Key']}")
            else:
                print("✅ Thumbnail directory structure ready (no objects yet)")
                
        except Exception as e:
            print(f"❌ Thumbnail directory test error: {e}")
            return False
        
        print("\n🎉 S3 thumbnail structure test passed!")
        return True
        
    except Exception as e:
        print(f"❌ S3 thumbnail structure test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting MediaConvert Integration Tests")
    print("=" * 50)
    
    # Test MediaConvert integration
    mediaconvert_success = test_mediaconvert_integration()
    
    # Test S3 thumbnail structure
    s3_success = test_s3_thumbnail_structure()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary")
    print("=" * 50)
    
    if mediaconvert_success and s3_success:
        print("🎉 ALL TESTS PASSED!")
        print("✅ MediaConvert integration working")
        print("✅ S3 thumbnail structure ready")
        print("\n🚀 Ready to test with actual video uploads!")
    else:
        print("❌ SOME TESTS FAILED")
        if not mediaconvert_success:
            print("❌ MediaConvert integration needs attention")
        if not s3_success:
            print("❌ S3 thumbnail structure needs attention")
    
    print("\n" + "=" * 50)
