import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBHelper } from "../../shared/utils/dynamodb";
import { authHelper } from "../../shared/utils/auth";

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

    const { videoId } = event.pathParameters || {};
    if (!videoId) {
      return createErrorResponse(400, "Video ID is required");
    }

    // Get video metadata from DynamoDB
    const video = await dynamoHelper.get(
      `ORG#${authResult.user!.orgId}`,
      `VIDEO#${videoId}`
    );

    if (!video) {
      return createErrorResponse(404, "Video not found");
    }

    // Check if user has access to this video
    if (video["orgId"] !== authResult.user!.orgId) {
      return createErrorResponse(403, "Access denied");
    }

    // Check if video is processed
    if (video["status"] !== "PROCESSED") {
      return createErrorResponse(400, "Video is not ready for playback");
    }

    // Generate presigned URL for video streaming
    const command = new GetObjectCommand({
      Bucket: process.env["VIDEO_BUCKET"]!,
      Key: video["s3Key"],
      ResponseContentType: "video/mp4",
    });

    const presignedUrl = await getPresignedUrl(command, 3600); // 1 hour expiry

    return createSuccessResponse({
      videoId,
      fileName: video["fileName"],
      status: video["status"],
      presignedUrl,
      metadata: {
        duration: video["duration"],
        size: video["size"],
        uploadedAt: video["uploadedAt"],
      },
    });
  } catch (error) {
    console.error("Error in playback handler:", error);
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
