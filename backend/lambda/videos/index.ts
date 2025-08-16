import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBHelper } from "../../shared/utils/dynamodb";
import { authHelper } from "../../shared/utils/auth";

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

    const { httpMethod } = event;

    if (httpMethod === "GET") {
      return await handleGetVideo(event, authResult.user!);
    }

    return createErrorResponse(405, "Method not allowed");
  } catch (error) {
    console.error("Error in videos handler:", error);
    return createErrorResponse(500, "Internal server error");
  }
};

async function handleGetVideo(
  event: APIGatewayProxyEvent,
  user: any
): Promise<APIGatewayProxyResult> {
  try {
    const { videoId } = event.pathParameters || {};
    if (!videoId) {
      return createErrorResponse(400, "Video ID is required");
    }

    // Get video metadata from DynamoDB
    const video = await dynamoHelper.get(
      `ORG#${user.orgId}`,
      `VIDEO#${videoId}`
    );

    if (!video) {
      return createErrorResponse(404, "Video not found");
    }

    // Check if user has access to this video
    if (video["orgId"] !== user.orgId) {
      return createErrorResponse(403, "Access denied");
    }

    // Return video details
    return createSuccessResponse({
      videoId: video["videoId"] || videoId,
      fileName: video["fileName"],
      status: video["status"],
      uploadedAt: video["uploadedAt"],
      duration: video["duration"],
      faceCount: video["faceCount"],
      orgId: video["orgId"],
      thumbnailUrl: video["thumbnailUrl"],
      detections: video["detections"] || [],
      metadata: {
        size: video["size"],
        s3Key: video["s3Key"],
        processingStartedAt: video["processingStartedAt"],
        processingCompletedAt: video["processingCompletedAt"],
      },
    });
  } catch (error) {
    console.error("Error getting video details:", error);
    return createErrorResponse(500, "Failed to get video details");
  }
}

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
