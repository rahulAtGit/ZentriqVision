#!/usr/bin/env python3
"""
Test script for real video upload and processing
This script creates a test video file, uploads it to S3, and tests the complete pipeline
"""

import boto3
import json
import os
import tempfile
import subprocess
from datetime import datetime

def create_test_video():
    """Use existing video file instead of creating a minimal one"""
    
    print("🎬 Using existing video file...")
    
    try:
        # Use existing video file
        video_path = "test-video.mp4"
        
        if os.path.exists(video_path):
            file_size = os.path.getsize(video_path)
            print(f"✅ Using existing video file: {video_path}")
            print(f"   File size: {file_size} bytes")
            print(f"   File exists: {os.path.exists(video_path)}")
            return video_path
        else:
            print(f"❌ Video file not found: {video_path}")
            print("   Please ensure test-video.mp4 exists in the current directory")
            return None
            
    except Exception as e:
        print(f"❌ Error accessing video file: {e}")
        return None

def upload_test_video(video_path, bucket_name, org_id="test-org", video_id="test-video-001"):
    """Upload test video to S3"""
    
    print(f"\n📤 Uploading test video to S3...")
    
    try:
        s3 = boto3.client('s3')
        
        # Create S3 key
        s3_key = f"{org_id}/videos/{video_id}.mp4"
        
        print(f"   Bucket: {bucket_name}")
        print(f"   Key: {s3_key}")
        
        # Upload video file
        s3.upload_file(video_path, bucket_name, s3_key)
        
        print(f"✅ Video uploaded successfully to s3://{bucket_name}/{s3_key}")
        return s3_key
        
    except Exception as e:
        print(f"❌ Error uploading video: {e}")
        return None

def wait_for_processing(bucket_name, org_id, video_id, timeout_minutes=5):
    """Wait for video processing to complete"""
    
    print(f"\n⏳ Waiting for video processing to complete (timeout: {timeout_minutes} minutes)...")
    
    import time
    start_time = time.time()
    timeout_seconds = timeout_minutes * 60
    
    while time.time() - start_time < timeout_seconds:
        try:
            # Check DynamoDB for video status
            dynamodb = boto3.resource('dynamodb')
            table = dynamodb.Table("zentriqvision-data")
            
            response = table.get_item(
                Key={
                    'PK': f"ORG#{org_id}",
                    'SK': f"VIDEO#{video_id}"
                }
            )
            
            if 'Item' in response:
                item = response['Item']
                status = item.get('status', 'UNKNOWN')
                
                print(f"   Current status: {status}")
                
                if status == 'PROCESSED':
                    print("🎉 Video processing completed successfully!")
                    return True
                elif status == 'ERROR':
                    error_msg = item.get('errorMessage', 'Unknown error')
                    print(f"❌ Video processing failed: {error_msg}")
                    return False
                elif status == 'PROCESSING':
                    print("   Still processing...")
                else:
                    print(f"   Status: {status}")
            else:
                print("   Video entry not found in DynamoDB yet...")
            
            # Wait 10 seconds before checking again
            time.sleep(10)
            
        except Exception as e:
            print(f"   Error checking status: {e}")
            time.sleep(10)
    
    print(f"⏰ Timeout reached after {timeout_minutes} minutes")
    return False

def check_mediaconvert_jobs(org_id, video_id):
    """Check if MediaConvert jobs were created"""
    
    print(f"\n🎥 Checking MediaConvert jobs...")
    
    try:
        mediaconvert = boto3.client('mediaconvert')
        
        # List recent jobs
        response = mediaconvert.list_jobs(MaxResults=10)
        
        if 'Jobs' in response:
            jobs = response['Jobs']
            print(f"✅ Found {len(jobs)} recent MediaConvert jobs")
            
            # Look for our test job
            test_jobs = [job for job in jobs if video_id in str(job.get('UserMetadata', {}))]
            
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
        print(f"❌ MediaConvert jobs check failed: {e}")
        return False

def check_thumbnails(bucket_name, org_id, video_id):
    """Check if thumbnails were generated"""
    
    print(f"\n🖼️ Checking generated thumbnails...")
    
    try:
        s3 = boto3.client('s3')
        
        # List objects in thumbnails directory
        response = s3.list_objects_v2(
            Bucket=bucket_name,
            Prefix=f"{org_id}/thumbnails/",
            MaxKeys=10
        )
        
        if 'Contents' in response:
            thumbnails = [obj['Key'] for obj in response['Contents'] if video_id in obj['Key']]
            
            if thumbnails:
                print(f"🎉 Found {len(thumbnails)} thumbnails for test video:")
                for thumb in thumbnails:
                    print(f"   - {thumb}")
                return True
            else:
                print("ℹ️ No thumbnails found for test video yet")
                return False
        else:
            print("ℹ️ Thumbnails directory is empty")
            return False
            
    except Exception as e:
        print(f"❌ Thumbnail check failed: {e}")
        return False

def main():
    """Main test function"""
    
    print("🚀 Starting Real Video Upload and Processing Test")
    print("=" * 60)
    
    # Configuration
    bucket_name = "zentriqvisionstack-zentriqvisionvideobucket68f2b96-b9xomlqxcw93"
    org_id = "test-org"
    video_id = "test-video-001"
    
    # Step 1: Create test video
    video_path = create_test_video()
    if not video_path:
        print("❌ Cannot proceed without test video")
        return
    
    # Step 2: Upload to S3
    s3_key = upload_test_video(video_path, bucket_name, org_id, video_id)
    if not s3_key:
        print("❌ Cannot proceed without video upload")
        return
    
    # Step 3: Wait for processing (S3 event should trigger Processing Lambda)
    print(f"\n🔄 S3 upload should trigger Processing Lambda automatically...")
    processing_success = wait_for_processing(bucket_name, org_id, video_id)
    
    # Step 4: Check MediaConvert jobs
    mediaconvert_success = check_mediaconvert_jobs(org_id, video_id)
    
    # Step 5: Check thumbnails
    thumbnails_success = check_thumbnails(bucket_name, org_id, video_id)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    if processing_success and mediaconvert_success and thumbnails_success:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Video processing pipeline working end-to-end")
        print("✅ MediaConvert integration working")
        print("✅ Thumbnail generation working")
        print("\n🚀 Ready for production video processing!")
    else:
        print("❌ SOME TESTS FAILED")
        if not processing_success:
            print("❌ Video processing needs attention")
        if not mediaconvert_success:
            print("❌ MediaConvert integration needs attention")
        if not thumbnails_success:
            print("❌ Thumbnail generation needs attention")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
