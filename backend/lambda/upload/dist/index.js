"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const dynamodb_1 = require("../../shared/utils/dynamodb");
const s3Client = new client_s3_1.S3Client({ region: process.env.AWS_REGION });
const dynamoHelper = new dynamodb_1.DynamoDBHelper(process.env.DATA_TABLE);
const handler = async (event) => {
    try {
        // Parse request body
        const body = JSON.parse(event.body || '{}');
        const { fileName, fileType, orgId, userId } = body;
        // Validate required fields
        if (!fileName || !fileType || !orgId || !userId) {
            return createErrorResponse(400, 'Missing required fields: fileName, fileType, orgId, userId');
        }
        // Generate unique video ID
        const videoId = (0, uuid_1.v4)();
        const s3Key = `${orgId}/videos/${videoId}/${fileName}`;
        // Create presigned URL for upload
        const putObjectCommand = new client_s3_1.PutObjectCommand({
            Bucket: process.env.VIDEO_BUCKET,
            Key: s3Key,
            ContentType: fileType,
        });
        const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, putObjectCommand, { expiresIn: 3600 });
        // Create video record in DynamoDB
        const videoItem = {
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
    }
    catch (error) {
        console.error('Error in upload handler:', error);
        return createErrorResponse(500, 'Internal server error');
    }
};
exports.handler = handler;
function createSuccessResponse(data) {
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
function createErrorResponse(statusCode, message) {
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
//# sourceMappingURL=index.js.map