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
      return await handleGetProfile(authResult.user!);
    } else if (httpMethod === "PUT") {
      return await handleUpdateProfile(event.body, authResult.user!);
    }

    return createErrorResponse(405, "Method not allowed");
  } catch (error) {
    console.error("Error in user profile handler:", error);
    return createErrorResponse(500, "Internal server error");
  }
};

async function handleGetProfile(user: any): Promise<APIGatewayProxyResult> {
  try {
    // Get user profile from DynamoDB
    const userProfile = await dynamoHelper.get(
      `USER#${user.userId}`,
      `PROFILE#${user.userId}`
    );

    if (!userProfile) {
      // Create default profile if none exists
      const defaultProfile = {
        PK: `USER#${user.userId}`,
        SK: `PROFILE#${user.userId}`,
        userId: user.userId,
        email: user.email,
        givenName: user.givenName,
        phoneNumber: user.phoneNumber,
        orgId: user.orgId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await dynamoHelper.put(defaultProfile);
      return createSuccessResponse(defaultProfile);
    }

    return createSuccessResponse(userProfile);
  } catch (error) {
    console.error("Error getting user profile:", error);
    return createErrorResponse(500, "Failed to get user profile");
  }
}

async function handleUpdateProfile(
  body: string | null,
  user: any
): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return createErrorResponse(400, "Request body is required");
    }

    const updateData = JSON.parse(body);
    const allowedFields = ["givenName", "phoneNumber"];

    // Filter out non-allowed fields
    const filteredData: any = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return createErrorResponse(400, "No valid fields to update");
    }

    // Get current profile
    const currentProfile = await dynamoHelper.get(
      `USER#${user.userId}`,
      `PROFILE#${user.userId}`
    );

    const updatedProfile = {
      ...currentProfile,
      ...filteredData,
      updatedAt: new Date().toISOString(),
    };

    await dynamoHelper.put(updatedProfile);

    return createSuccessResponse(updatedProfile);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return createErrorResponse(500, "Failed to update user profile");
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
    body: JSON.stringify({
      error: message,
    }),
  };
}
