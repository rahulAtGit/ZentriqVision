import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBHelper } from '../../shared/utils/dynamodb';
import { UploadRequest, ApiResponse, Video } from '../../shared/types';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoHelper = new DynamoDBHelper(process.env.DATA_TABLE!);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}') as UploadRequest;
    const { fileName, fileType, orgId, userId } = body;

    // Validate required fields
    if (!fileName || !fileType || !orgId || !userId) {
      return createErrorResponse(400, 'Missing required fields: fileName, fileType, orgId, userId');
    }

    // Generate unique video ID
    const videoId = uuidv4();
    const s3Key = `${orgId}/videos/${videoId}/${fileName}`;

    // Create presigned URL for upload
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.VIDEO_BUCKET!,
      Key: s3Key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 3600 });

    // Create video record in DynamoDB
    const videoItem: Video = {
      videoId,
      fileName,
      fileType,
      status: 'UPLOADING',
      orgId,
      userId,
      s3Key,
      uploadedAt: new Date().toISOString(),
    };

    const dynamoItem = {
      PK: `ORG#${orgId}`,
      SK: `VIDEO#${videoId}`,
      ...videoItem,
    };

    await dynamoHelper.put(dynamoItem);

    return createSuccessResponse({
      videoId,
      presignedUrl,
      s3Key,
      status: 'UPLOADING',
    });

  } catch (error) {
    console.error('Error in upload handler:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

function createSuccessResponse(data: any): ApiResponse {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(data),
  };
}

function createErrorResponse(statusCode: number, message: string): ApiResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify({ error: message }),
  };
}
