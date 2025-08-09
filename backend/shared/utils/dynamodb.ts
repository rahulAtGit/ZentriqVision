import { DynamoDBClient, QueryCommand, PutItemCommand, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBItem } from '../types';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export class DynamoDBHelper {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Query items by partition key and sort key condition
   */
  async query(
    pk: string,
    skCondition?: string,
    skValue?: string,
    indexName?: string
  ): Promise<DynamoDBItem[]> {
    const keyConditionExpression = skCondition 
      ? 'PK = :pk AND begins_with(SK, :sk)'
      : 'PK = :pk';

    const expressionAttributeValues: any = {
      ':pk': { S: pk }
    };

    if (skCondition && skValue) {
      expressionAttributeValues[':sk'] = { S: skValue };
    }

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: indexName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    const response = await dynamoClient.send(command);
    return response.Items?.map(item => unmarshall(item) as DynamoDBItem) || [];
  }

  /**
   * Get a single item by primary key
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
   * Put a new item
   */
  async put(item: DynamoDBItem): Promise<void> {
    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: marshall(item)
    });

    await dynamoClient.send(command);
  }

  /**
   * Update an existing item
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
   * Query by GSI
   */
  async queryGSI(
    gsiName: string,
    gsiPk: string,
    gsiSkCondition?: string,
    gsiSkValue?: string
  ): Promise<DynamoDBItem[]> {
    const keyConditionExpression = gsiSkCondition 
      ? 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)'
      : 'GSI1PK = :pk';

    const expressionAttributeValues: any = {
      ':pk': { S: gsiPk }
    };

    if (gsiSkCondition && gsiSkValue) {
      expressionAttributeValues[':sk'] = { S: gsiSkValue };
    }

    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: gsiName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    const response = await dynamoClient.send(command);
    return response.Items?.map(item => unmarshall(item) as DynamoDBItem) || [];
  }
}

// Helper functions for common operations
export const createDynamoDBHelper = (tableName: string) => new DynamoDBHelper(tableName);

export const generatePK = (type: string, id: string) => `${type}#${id}`;
export const generateSK = (type: string, id: string) => `${type}#${id}`;
