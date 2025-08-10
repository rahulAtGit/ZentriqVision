import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBHelper } from "../../shared/utils/dynamodb";
import { authHelper } from "../../shared/utils/auth";
import { UploadRequest, DynamoDBItem } from "../../shared/types";

const s3Client = new S3Client({
  region: process.env["AWS_REGION"] || "us-east-1",
});
const dynamoHelper = new DynamoDBHelper(process.env["DATA_TABLE"]!);

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Validate JWT token
    const authResult = await authHelper.validateToken(
      event.headers["Authorization"]
    );
    if (!authResult.isValid) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    if (!event.body) {
      return createErrorResponse(400, "Request body is required");
    }

    const uploadRequest: UploadRequest = JSON.parse(event.body);

    // Validate required fields
    if (
      !uploadRequest.fileName ||
      !uploadRequest.fileType ||
      !uploadRequest.orgId
    ) {
      return createErrorResponse(400, "Missing required fields");
    }

    // Generate unique video ID and S3 key
    const videoId = `video_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const s3Key = `videos/${uploadRequest.orgId}/${videoId}/${uploadRequest.fileName}`;

    // Create video record in DynamoDB
    const videoItem: DynamoDBItem = {
      PK: `ORG#${uploadRequest.orgId}`,
      SK: `VIDEO#${videoId}`,
      GSI1PK: `STATUS#UPLOADING`,
      GSI1SK: new Date().toISOString(),
      videoId,
      fileName: uploadRequest.fileName,
      fileType: uploadRequest.fileType,
      status: "UPLOADING",
      orgId: uploadRequest.orgId,
      userId: authResult.user!.userId,
      s3Key,
      uploadedAt: new Date().toISOString(),
    };

    await dynamoHelper.put(videoItem);

    // Generate presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: process.env["VIDEO_BUCKET"]!,
      Key: s3Key,
      ContentType: uploadRequest.fileType,
    });

    const presignedUrl = await getPresignedUrl(command, 3600); // 1 hour expiry

    return createSuccessResponse({
      videoId,
      presignedUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Error in upload handler:", error);
    return createErrorResponse(500, "Internal server error");
  }
};

function createSuccessResponse(data: any): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify(data),
  };
}

function createErrorResponse(
  statusCode: number,
  message: string
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    },
    body: JSON.stringify({ error: message }),
  };
}

async function getPresignedUrl(
  command: any,
  expiresIn: number
): Promise<string> {
  // This would use AWS SDK v3's getSignedUrl
  // For now, returning a placeholder
  return `https://example.com/presigned-url-${Date.now()}`;
}
