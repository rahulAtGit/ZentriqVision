"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSK = exports.generatePK = exports.createDynamoDBHelper = exports.DynamoDBHelper = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION });
class DynamoDBHelper {
    constructor(tableName) {
        this.tableName = tableName;
    }
    /**
     * Query items by partition key and sort key condition
     */
    async query(pk, skCondition, skValue, indexName) {
        const keyConditionExpression = skCondition
            ? 'PK = :pk AND begins_with(SK, :sk)'
            : 'PK = :pk';
        const expressionAttributeValues = {
            ':pk': { S: pk }
        };
        if (skCondition && skValue) {
            expressionAttributeValues[':sk'] = { S: skValue };
        }
        const command = new client_dynamodb_1.QueryCommand({
            TableName: this.tableName,
            IndexName: indexName,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
        });
        const response = await dynamoClient.send(command);
        return response.Items?.map(item => (0, util_dynamodb_1.unmarshall)(item)) || [];
    }
    /**
     * Get a single item by primary key
     */
    async get(pk, sk) {
        const command = new client_dynamodb_1.GetItemCommand({
            TableName: this.tableName,
            Key: {
                PK: { S: pk },
                SK: { S: sk }
            }
        });
        const response = await dynamoClient.send(command);
        return response.Item ? (0, util_dynamodb_1.unmarshall)(response.Item) : null;
    }
    /**
     * Put a new item
     */
    async put(item) {
        const command = new client_dynamodb_1.PutItemCommand({
            TableName: this.tableName,
            Item: (0, util_dynamodb_1.marshall)(item)
        });
        await dynamoClient.send(command);
    }
    /**
     * Update an existing item
     */
    async update(pk, sk, updateExpression, expressionAttributeNames, expressionAttributeValues) {
        const command = new client_dynamodb_1.UpdateItemCommand({
            TableName: this.tableName,
            Key: {
                PK: { S: pk },
                SK: { S: sk }
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: (0, util_dynamodb_1.marshall)(expressionAttributeValues)
        });
        await dynamoClient.send(command);
    }
    /**
     * Query by GSI
     */
    async queryGSI(gsiName, gsiPk, gsiSkCondition, gsiSkValue) {
        const keyConditionExpression = gsiSkCondition
            ? 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)'
            : 'GSI1PK = :pk';
        const expressionAttributeValues = {
            ':pk': { S: gsiPk }
        };
        if (gsiSkCondition && gsiSkValue) {
            expressionAttributeValues[':sk'] = { S: gsiSkValue };
        }
        const command = new client_dynamodb_1.QueryCommand({
            TableName: this.tableName,
            IndexName: gsiName,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
        });
        const response = await dynamoClient.send(command);
        return response.Items?.map(item => (0, util_dynamodb_1.unmarshall)(item)) || [];
    }
}
exports.DynamoDBHelper = DynamoDBHelper;
// Helper functions for common operations
const createDynamoDBHelper = (tableName) => new DynamoDBHelper(tableName);
exports.createDynamoDBHelper = createDynamoDBHelper;
const generatePK = (type, id) => `${type}#${id}`;
exports.generatePK = generatePK;
const generateSK = (type, id) => `${type}#${id}`;
exports.generateSK = generateSK;
//# sourceMappingURL=dynamodb.js.map