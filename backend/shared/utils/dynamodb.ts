import { DynamoDBClient, GetItemCommand, QueryCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBItem } from '../types';

const dynamoClient = new DynamoDBClient({ region: process.env["AWS_REGION"] || "us-east-1" });

export class DynamoDBHelper {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Get an item by primary key and sort key
   */
  async get(pk: string, sk: string): Promise<DynamoDBItem | null> {
    const command = new GetItemCommand({
      TableName: this.tableName,
      Key: {
        PK: { S: pk },
        SK: { S: sk }
      }
    });

    const response = await dynamoClient.send(command);
    return response.Item ? unmarshall(response.Item) as DynamoDBItem : null;
  }

  /**
   * Put an item into the table
   */
  async put(item: DynamoDBItem): Promise<void> {
    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: marshall(item)
    });

    await dynamoClient.send(command);
  }

  /**
   * Update an item in the table
   */
  async update(
    pk: string,
    sk: string,
    updateExpression: string,
    expressionAttributeNames: Record<string, string>,
    expressionAttributeValues: Record<string, any>
  ): Promise<void> {
    const command = new UpdateItemCommand({
      TableName: this.tableName,
      Key: {
        PK: { S: pk },
        SK: { S: sk }
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues)
    });

    await dynamoClient.send(command);
  }

  /**
   * Delete an item from the table
   */
  async delete(pk: string, sk: string): Promise<void> {
    const command = new DeleteItemCommand({
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
  async queryGSI(indexName: string, pk: string): Promise<DynamoDBItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: indexName,
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: pk }
      }
    });

    const response = await dynamoClient.send(command);
    return response.Items ? response.Items.map(item => unmarshall(item) as DynamoDBItem) : [];
  }

  /**
   * Query items by primary key
   */
  async query(pk: string): Promise<DynamoDBItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: {
        ":pk": { S: pk }
      }
    });

    const response = await dynamoClient.send(command);
    return response.Items ? response.Items.map(item => unmarshall(item) as DynamoDBItem) : [];
  }
}

// Helper functions for common operations
export const createDynamoDBHelper = (tableName: string) => new DynamoDBHelper(tableName);

export const generatePK = (type: string, id: string) => `${type}#${id}`;
export const generateSK = (type: string, id: string) => `${type}#${id}`;
