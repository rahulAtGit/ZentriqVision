import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBHelper } from "../../shared/utils/dynamodb";
import { authHelper } from "../../shared/utils/auth";
import { SearchRequest, SearchFilters, DynamoDBItem } from "../../shared/types";

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

    const { orgId, videoId } = event.pathParameters || {};
    const queryParams = event.queryStringParameters || {};

    // Use authenticated user's orgId if not provided in path
    const authenticatedOrgId = orgId || authResult.user!.orgId || "default-org";
    if (!authenticatedOrgId) {
      return createErrorResponse(400, "Missing orgId parameter");
    }

    let results: DynamoDBItem[] = [];

    if (videoId) {
      // Get specific video
      const video = await dynamoHelper.get(
        `ORG#${authenticatedOrgId}`,
        `VIDEO#${videoId}`
      );
      if (video) {
        results = [video];
      }
    } else {
      // Search based on filters
      const filters = parseFilters(queryParams);
      results = await performSearch(authenticatedOrgId, filters);
    }

    return createSuccessResponse({
      results,
      count: results.length,
      orgId: authenticatedOrgId,
      filters: queryParams,
    });
  } catch (error) {
    console.error("Error in search handler:", error);
    return createErrorResponse(500, "Internal server error");
  }
};

async function performSearch(
  orgId: string,
  filters: SearchFilters & { limit?: number }
): Promise<DynamoDBItem[]> {
  let results: DynamoDBItem[] = [];

  // If searching by attributes, use GSI1
  if (filters.color || filters.emotion || filters.ageBucket) {
    const attributeQueries = [];

    if (filters.color) {
      attributeQueries.push(`ATTR#color#${filters.color}`);
    }
    if (filters.emotion) {
      attributeQueries.push(`ATTR#emotion#${filters.emotion}`);
    }
    if (filters.ageBucket) {
      attributeQueries.push(`ATTR#age#${filters.ageBucket}`);
    }

    for (const attrQuery of attributeQueries) {
      const items = await dynamoHelper.queryGSI("AttributeIndex", attrQuery);
      results.push(...items.filter((item) => item.PK === `ORG#${orgId}`));
    }
  }
  // If searching by video, use GSI2
  else if (filters.videoId) {
    results = await dynamoHelper.queryGSI(
      "VideoIndex",
      `VIDEO#${filters.videoId}`
    );
    results = results.filter((item) => item.PK === `ORG#${orgId}`);
  }
  // If searching by time, use GSI3
  else if (filters.timeRange) {
    const dateKey = `TIME#${filters.timeRange.start.split("T")[0]}`;
    results = await dynamoHelper.queryGSI("TimeIndex", dateKey);
    results = results.filter((item) => item.PK === `ORG#${orgId}`);
  }
  // Default: search by organization
  else {
    results = await dynamoHelper.query(`ORG#${orgId}`);
  }

  // Apply limit if specified
  if (filters.limit && results.length > filters.limit) {
    results = results.slice(0, filters.limit);
  }

  return results;
}

function parseFilters(
  queryParams: Record<string, string | undefined>
): SearchFilters & { limit?: number } {
  const filters: SearchFilters & { limit?: number } = {};

  if (queryParams.color) filters.color = queryParams.color;
  if (queryParams.emotion) filters.emotion = queryParams.emotion;
  if (queryParams.ageBucket) filters.ageBucket = queryParams.ageBucket;
  if (queryParams.mask !== undefined)
    filters.mask = queryParams.mask === "true";
  if (queryParams.videoId) filters.videoId = queryParams.videoId;
  if (queryParams.personId) filters.personId = queryParams.personId;
  if (queryParams.limit) filters.limit = parseInt(queryParams.limit);

  if (queryParams.start && queryParams.end) {
    filters.timeRange = {
      start: queryParams.start,
      end: queryParams.end,
    };
  }

  return filters;
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
