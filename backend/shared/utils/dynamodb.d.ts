import { DynamoDBItem } from '../types';
export declare class DynamoDBHelper {
    private tableName;
    constructor(tableName: string);
    /**
     * Get an item by primary key and sort key
     */
    get(pk: string, sk: string): Promise<DynamoDBItem | null>;
    /**
     * Put an item into the table
     */
    put(item: DynamoDBItem): Promise<void>;
    /**
     * Update an item in the table
     */
    update(pk: string, sk: string, updateExpression: string, expressionAttributeNames: Record<string, string>, expressionAttributeValues: Record<string, any>): Promise<void>;
    /**
     * Delete an item from the table
     */
    delete(pk: string, sk: string): Promise<void>;
    /**
     * Query items using a GSI
     */
    queryGSI(indexName: string, pk: string): Promise<DynamoDBItem[]>;
    /**
     * Query items by primary key
     */
    query(pk: string): Promise<DynamoDBItem[]>;
}
export declare const createDynamoDBHelper: (tableName: string) => DynamoDBHelper;
export declare const generatePK: (type: string, id: string) => string;
export declare const generateSK: (type: string, id: string) => string;
//# sourceMappingURL=dynamodb.d.ts.map