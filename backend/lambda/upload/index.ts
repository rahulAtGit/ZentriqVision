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
      GSI1PK: `STATUS#PROCESSING`,
      GSI1SK: new Date().toISOString(),
      videoId,
      fileName: uploadRequest.fileName,
      fileType: uploadRequest.fileType,
      status: "PROCESSING",
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

    console.log("S3 PutObjectCommand:", {
      bucket: process.env["VIDEO_BUCKET"]!,
      key: s3Key,
      contentType: uploadRequest.fileType,
    });

    const presignedUrl = await getPresignedUrl(command, 3600); // 1 hour expiry
    console.log(
      "Generated presigned URL:",
      presignedUrl.substring(0, 100) + "..."
    );

    return createSuccessResponse({
      videoId,
      presignedUrl,
      s3Key,
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
  try {
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate upload URL");
  }
}
