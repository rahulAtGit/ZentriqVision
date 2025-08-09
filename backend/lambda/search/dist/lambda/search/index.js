"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_1 = require("../../shared/utils/dynamodb");
const dynamoHelper = new dynamodb_1.DynamoDBHelper(process.env.DATA_TABLE);
const handler = async (event) => {
    try {
        const { orgId, videoId } = event.pathParameters || {};
        const queryParams = event.queryStringParameters || {};
        if (!orgId) {
            return createErrorResponse(400, "Missing orgId parameter");
        }
        let results = [];
        if (videoId) {
            // Get specific video
            const video = await dynamoHelper.get(`ORG#${orgId}`, `VIDEO#${videoId}`);
            if (video) {
                results = [video];
            }
        }
        else {
            // Search based on filters
            const filters = parseFilters(queryParams);
            results = await performSearch(orgId, filters);
        }
        return createSuccessResponse({
            results,
            count: results.length,
            orgId,
            filters: queryParams,
        });
    }
    catch (error) {
        console.error("Error in search handler:", error);
        return createErrorResponse(500, "Internal server error");
    }
};
exports.handler = handler;
async function performSearch(orgId, filters) {
    let results = [];
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
        results = await dynamoHelper.queryGSI("VideoIndex", `VIDEO#${filters.videoId}`);
        results = results.filter((item) => item.PK === `ORG#${orgId}`);
    }
    // If searching by time, use GSI3
    else if (filters.timeRange) {
        const dateKey = `TIME#${filters.timeRange.start.split("T")[0]}`;
        results = await dynamoHelper.queryGSI("TimeIndex", dateKey);
        results = results.filter((item) => item.PK === `ORG#${orgId}`);
    }
    // Default: get all videos for the organization
    else {
        results = await dynamoHelper.query(`ORG#${orgId}`, "begins_with", "VIDEO#");
    }
    // Apply additional filters
    if (filters.personId) {
        results = results.filter((item) => item.personId === filters.personId);
    }
    if (filters.mask !== undefined) {
        results = results.filter((item) => item.attributes?.mask === filters.mask);
    }
    return results.slice(0, filters.limit || 50);
}
function parseFilters(queryParams) {
    const filters = {};
    if (queryParams.color)
        filters.color = queryParams.color;
    if (queryParams.emotion)
        filters.emotion = queryParams.emotion;
    if (queryParams.ageBucket)
        filters.ageBucket = queryParams.ageBucket;
    if (queryParams.videoId)
        filters.videoId = queryParams.videoId;
    if (queryParams.personId)
        filters.personId = queryParams.personId;
    if (queryParams.mask)
        filters.mask = queryParams.mask === "true";
    if (queryParams.limit)
        filters.limit = parseInt(queryParams.limit);
    if (queryParams.startTime && queryParams.endTime) {
        filters.timeRange = {
            start: queryParams.startTime,
            end: queryParams.endTime,
        };
    }
    return filters;
}
function createSuccessResponse(data) {
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
function createErrorResponse(statusCode, message) {
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
//# sourceMappingURL=index.js.map