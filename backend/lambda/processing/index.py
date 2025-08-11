import json
import boto3
import os
from datetime import datetime, timedelta
import uuid
from typing import Dict, Any, List

# Initialize AWS clients
rekognition = boto3.client('rekognition')
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def generate_thumbnail(bucket: str, video_key: str, org_id: str, video_id: str, faces_data: List[Dict[str, Any]]) -> str:
    """Generate thumbnail from first frame with faces using AWS MediaConvert"""
    
    if not faces_data:
        print(f"No faces detected in video {video_id}, skipping thumbnail generation")
        return None
    
    try:
        # Find first frame with faces
        first_face_timestamp = min(face['Timestamp'] for face in faces_data)
        frame_number = int(first_face_timestamp / 1000)  # Convert ms to seconds
        
        print(f"First face detected at {frame_number} seconds for thumbnail")
        
        # Create thumbnail key structure
        thumbnail_key = f"{org_id}/thumbnails/{video_id}.jpg"
        
        # Use AWS MediaConvert to extract frame
        try:
            # Use MediaConvert endpoint from environment variable
            mediaconvert_endpoint = os.environ.get('MEDIACONVERT_ENDPOINT', 'https://mediaconvert.us-east-1.amazonaws.com')
            
            # Create MediaConvert client with endpoint
            mediaconvert_client = boto3.client('mediaconvert', endpoint_url=mediaconvert_endpoint)
            
            # Create job for frame extraction (simplified approach)
            job_settings = {
                'TimecodeConfig': {
                    'Source': 'ZEROBASED'
                },
                'Inputs': [{
                    'FileInput': f"s3://{bucket}/{video_key}"
                }],
                'OutputGroups': [{
                    'Name': 'File Group',
                    'OutputGroupSettings': {
                        'Type': 'FILE_GROUP_SETTINGS',
                        'FileGroupSettings': {
                            'Destination': f"s3://{bucket}/{org_id}/thumbnails/"
                        }
                    },
                    'Outputs': [
                        {
                            'NameModifier': f"_{video_id}_video",
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
                            'NameModifier': f"_{video_id}_frame",
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
            
                        # Submit MediaConvert job
            response = mediaconvert_client.create_job(
                    Role='arn:aws:iam::804857032172:role/ZentriqVisionStack-MediaConvertServiceRole08F94F4A-LiWrgvEvyiN6',  # Use our custom MediaConvert role
                    Settings=job_settings,
                    UserMetadata={
                        'videoId': video_id,
                        'orgId': org_id,
                        'frameTimestamp': str(frame_number)
                    }
                )
            
            job_id = response['Job']['Id']
            print(f"MediaConvert job {job_id} submitted for frame extraction")
            
            # Store job ID in DynamoDB for tracking
            table = dynamodb.Table(os.environ['DATA_TABLE'])
            table.update_item(
                Key={
                    'PK': f"ORG#{org_id}",
                    'SK': f"VIDEO#{video_id}"
                },
                UpdateExpression="SET mediaConvertJobId = :jobId, thumbnailStatus = :status",
                ExpressionAttributeValues={
                    ':jobId': job_id,
                    ':status': 'processing'
                }
            )
            
            # For now, return the expected thumbnail key
            # The actual thumbnail will be generated asynchronously by MediaConvert
            return thumbnail_key
            
        except Exception as e:
            print(f"MediaConvert error: {e}")
            # Fallback: return placeholder for now
            return thumbnail_key
                
    except Exception as e:
        print(f"Error in thumbnail generation: {e}")
        return None

def handler(event, context):
    """Main handler that routes events to appropriate functions"""
    
    print(f"Processing event: {json.dumps(event)}")
    
    # Check event type and route accordingly
    for record in event['Records']:
        if 'EventSource' in record and record['EventSource'] == 'aws:sns':
            # This is an SNS event (Rekognition completion)
            print("Routing to Rekognition results processing")
            return process_rekognition_results(event, context)
        elif 's3' in record:
            # This is an S3 event (video upload)
            print("Routing to S3 video processing")
            return process_s3_video_upload(event, context)
        else:
            print(f"Unknown event type: {record}")
    
    return {
        'statusCode': 400,
        'body': json.dumps('Unknown event type')
    }

def process_s3_video_upload(event, context):
    """Process uploaded video using AWS Rekognition"""
    
    # Parse S3 event
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        
        # Extract video metadata from S3 key
        parts = key.split('/')
        if len(parts) >= 3:
            org_id = parts[0]
            video_id = parts[2]
        else:
            print(f"Invalid key format: {key}")
            continue
        
        print(f"Processing video {video_id} for org {org_id}")
        
        # Update video status to PROCESSING and store video key
        table = dynamodb.Table(os.environ['DATA_TABLE'])
        table.update_item(
            Key={
                'PK': f"ORG#{org_id}",
                'SK': f"VIDEO#{video_id}"
            },
            UpdateExpression="SET #status = :status, processingStartedAt = :timestamp, videoKey = :videoKey",
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': 'PROCESSING',
                ':timestamp': datetime.utcnow().isoformat(),
                ':videoKey': key
            }
        )
        
        # Start Rekognition Video analysis
        try:
            response = rekognition.start_face_detection(
                Video={
                    'S3Object': {
                        'Bucket': bucket,
                        'Name': key
                    }
                },
                NotificationChannel={
                    'SNSTopicArn': os.environ['SNS_TOPIC_ARN'],
                    'RoleArn': os.environ['REKOGNITION_ROLE_ARN']
                },
                JobTag=f"{org_id}_{video_id}",
                FaceAttributes='ALL'
            )
            
            # Store Rekognition job ID
            table.update_item(
                Key={
                    'PK': f"ORG#{org_id}",
                    'SK': f"VIDEO#{video_id}"
                },
                UpdateExpression="SET rekognitionJobId = :jobId",
                ExpressionAttributeValues={
                    ':jobId': response['JobId']
                }
            )
            
            print(f"Started Rekognition job {response['JobId']} for video {video_id}")
            
        except Exception as e:
            print(f"Error starting Rekognition job: {e}")
            # Update status to ERROR
            table.update_item(
                Key={
                    'PK': f"ORG#{org_id}",
                    'SK': f"VIDEO#{video_id}"
                },
                UpdateExpression="SET #status = :status, errorMessage = :error",
                ExpressionAttributeNames={
                    '#status': 'status'
                },
                ExpressionAttributeValues={
                    ':status': 'ERROR',
                    ':error': str(e)
                }
            )
    
    return {
        'statusCode': 200,
        'body': json.dumps('Video processing initiated')
    }

def process_rekognition_results(event, context):
    """Process Rekognition results and store in DynamoDB"""
    
    print(f"Processing Rekognition results: {json.dumps(event)}")
    
    # Parse SNS message
    for record in event['Records']:
        sns_message = json.loads(record['Sns']['Message'])
        job_id = sns_message['JobId']
        status = sns_message['Status']
        
        # Extract org_id and video_id from job tag
        job_tag = sns_message.get('JobTag', '')
        if '_' in job_tag:
            org_id, video_id = job_tag.split('_', 1)
        else:
            print(f"Invalid job tag: {job_tag}")
            continue
        
        table = dynamodb.Table(os.environ['DATA_TABLE'])
        
        if status == 'SUCCEEDED':
            # Get Rekognition results
            try:
                response = rekognition.get_face_detection(JobId=job_id)
                
                # Process and store results
                process_face_detections(org_id, video_id, response['Faces'])
                
                # Get video info from DynamoDB to get bucket and key
                video_item = table.get_item(
                    Key={
                        'PK': f"ORG#{org_id}",
                        'SK': f"VIDEO#{video_id}"
                    }
                )
                
                if 'Item' in video_item:
                    video_info = video_item['Item']
                    bucket = os.environ['VIDEO_BUCKET']
                    video_key = video_info.get('videoKey', f"{org_id}/videos/{video_id}.mp4")
                    
                    # Calculate first face timestamp
                    first_face_timestamp = min(face['Timestamp'] for face in response['Faces']) if response['Faces'] else 0
                    
                    # Generate thumbnail from first frame with faces
                    print(f"Generating thumbnail for video {video_id}")
                    thumbnail_key = generate_thumbnail(bucket, video_key, org_id, video_id, response['Faces'])
                    
                    # Update video status to PROCESSED with thumbnail info
                    update_expression = "SET #status = :status, processingCompletedAt = :timestamp"
                    expression_values = {
                        ':status': 'PROCESSED',
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                    
                    if thumbnail_key:
                        update_expression += ", thumbnailUrl = :thumbnailUrl, thumbnailMetadata = :thumbnailMeta"
                        expression_values[':thumbnailUrl'] = f"s3://{bucket}/{thumbnail_key}"
                        expression_values[':thumbnailMeta'] = {
                            'frameTimestamp': int(first_face_timestamp / 1000),
                            'faceCount': len(response['Faces']),
                            'generatedAt': datetime.utcnow().isoformat(),
                            'status': 'metadata_ready'  # Will be 'ready' when actual image is generated
                        }
                else:
                    print(f"Video info not found for {video_id}")
                    thumbnail_key = None
                    update_expression = "SET #status = :status, processingCompletedAt = :timestamp"
                    expression_values = {
                        ':status': 'PROCESSED',
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                
                table.update_item(
                    Key={
                        'PK': f"ORG#{org_id}",
                        'SK': f"VIDEO#{video_id}"
                    },
                    UpdateExpression=update_expression,
                    ExpressionAttributeNames={
                        '#status': 'status'
                    },
                    ExpressionAttributeValues=expression_values
                )
                
                print(f"Successfully processed video {video_id}")
                
            except Exception as e:
                print(f"Error processing Rekognition results: {e}")
                # Update status to ERROR
                table.update_item(
                    Key={
                        'PK': f"ORG#{org_id}",
                        'SK': f"VIDEO#{video_id}"
                    },
                    UpdateExpression="SET #status = :status, errorMessage = :error",
                    ExpressionAttributeNames={
                        '#status': 'status'
                    },
                    ExpressionAttributeValues={
                        ':status': 'ERROR',
                        ':error': str(e)
                    }
                )
        
        elif status == 'FAILED':
            # Update status to ERROR
            table.update_item(
                Key={
                    'PK': f"ORG#{org_id}",
                    'SK': f"VIDEO#{video_id}"
                },
                UpdateExpression="SET #status = :status, errorMessage = :error",
                ExpressionAttributeNames={
                    '#status': 'status'
                },
                ExpressionAttributeValues={
                    ':status': 'ERROR',
                    ':error': 'Rekognition job failed'
                }
            )
    
    return {
        'statusCode': 200,
        'body': json.dumps('Results processed')
    }

def process_face_detections(org_id: str, video_id: str, faces: List[Dict[str, Any]]):
    """Process face detection results and store in DynamoDB"""
    
    table = dynamodb.Table(os.environ['DATA_TABLE'])
    
    for face in faces:
        # Generate unique person ID
        person_id = str(uuid.uuid4())
        timestamp = face['Timestamp']
        
        # Extract attributes
        attributes = face.get('Face', {})
        face_details = attributes.get('FaceDetails', [{}])[0]
        
        # Create person detection record
        detection_item = {
            'PK': f"ORG#{org_id}",
            'SK': f"APPEAR#{video_id}#{timestamp}",
            'personId': person_id,
            'videoId': video_id,
            'timestamp': datetime.fromtimestamp(timestamp/1000).isoformat(),
            'confidence': attributes.get('Confidence', 0),
            'attributes': {
                'ageBucket': get_age_bucket(face_details.get('AgeRange', {})),
                'gender': face_details.get('Gender', {}).get('Value', 'unknown'),
                'emotion': get_primary_emotion(face_details.get('Emotions', [])),
                'mask': face_details.get('FaceOccluded', {}).get('Value', False),
            },
            'GSI1PK': f"ATTR#color#unknown",  # Will be updated by color detection
            'GSI1SK': f"APPEAR#{timestamp}",
            'GSI2PK': f"VIDEO#{video_id}",
            'GSI2SK': f"APPEAR#{timestamp}",
            'GSI3PK': f"TIME#{datetime.fromtimestamp(timestamp/1000).strftime('%Y%m%d')}",
            'GSI3SK': f"APPEAR#{timestamp}",
        }
        
        # Store in DynamoDB
        table.put_item(Item=detection_item)
        
        print(f"Stored detection for person {person_id} in video {video_id}")

def get_age_bucket(age_range: Dict[str, int]) -> str:
    """Convert age range to bucket"""
    if not age_range:
        return 'unknown'
    
    low = age_range.get('Low', 0)
    high = age_range.get('High', 0)
    avg_age = (low + high) // 2
    
    if avg_age < 18:
        return '0-17'
    elif avg_age < 25:
        return '18-24'
    elif avg_age < 35:
        return '25-34'
    elif avg_age < 50:
        return '35-49'
    else:
        return '50+'

def get_primary_emotion(emotions: List[Dict[str, Any]]) -> str:
    """Get the primary emotion from the list"""
    if not emotions:
        return 'neutral'
    
    # Sort by confidence and return the highest
    sorted_emotions = sorted(emotions, key=lambda x: x.get('Confidence', 0), reverse=True)
    return sorted_emotions[0].get('Type', 'neutral').lower()
