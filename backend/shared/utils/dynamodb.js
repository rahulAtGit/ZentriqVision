"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSK = exports.generatePK = exports.createDynamoDBHelper = exports.DynamoDBHelper = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const util_dynamodb_1 = require("@aws-sdk/util-dynamodb");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({ region: process.env["AWS_REGION"] || "us-east-1" });
class DynamoDBHelper {
    constructor(tableName) {
        this.tableName = tableName;
    }
    /**
     * Get an item by primary key and sort key
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
     * Put an item into the table
     */
    async put(item) {
        const command = new client_dynamodb_1.PutItemCommand({
            TableName: this.tableName,
            Item: (0, util_dynamodb_1.marshall)(item)
        });
        await dynamoClient.send(command);
    }
    /**
     * Update an item in the table
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
     * Delete an item from the table
     */
    async delete(pk, sk) {
        const command = new client_dynamodb_1.DeleteItemCommand({
            TableName: this.tableName,
            Key: {
                PK: { S: pk },
                SK: { S: sk }
            }
        });
        await dynamoClient.send(command);
    }
    /**
     * Query items using a GSI
     */
    async queryGSI(indexName, pk) {
        const command = new client_dynamodb_1.QueryCommand({
            TableName: this.tableName,
            IndexName: indexName,
            KeyConditionExpression: "GSI1PK = :pk",
            ExpressionAttributeValues: {
                ":pk": { S: pk }
            }
        });
        const response = await dynamoClient.send(command);
        return response.Items ? response.Items.map(item => (0, util_dynamodb_1.unmarshall)(item)) : [];
    }
    /**
     * Query items by primary key
     */
    async query(pk) {
        const command = new client_dynamodb_1.QueryCommand({
            TableName: this.tableName,
            KeyConditionExpression: "PK = :pk",
            ExpressionAttributeValues: {
                ":pk": { S: pk }
            }
        });
        const response = await dynamoClient.send(command);
        return response.Items ? response.Items.map(item => (0, util_dynamodb_1.unmarshall)(item)) : [];
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