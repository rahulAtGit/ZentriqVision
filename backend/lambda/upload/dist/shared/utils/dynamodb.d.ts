import { DynamoDBItem } from '../types';
export declare class DynamoDBHelper {
    private tableName;
    constructor(tableName: string);
    /**
     * Query items by partition key and sort key condition
     */
    query(pk: string, skCondition?: string, skValue?: string, indexName?: string): Promise<DynamoDBItem[]>;
    /**
     * Get a single item by primary key
     */
    get(pk: string, sk: string): Promise<DynamoDBItem | null>;
    /**
     * Put a new item
     */
    put(item: DynamoDBItem): Promise<void>;
    /**
     * Update an existing item
     */
    update(pk: string, sk: string, updateExpression: string, expressionAttributeNames: Record<string, string>, expressionAttributeValues: Record<string, any>): Promise<void>;
    /**
     * Query by GSI
     */
    queryGSI(gsiName: string, gsiPk: string, gsiSkCondition?: string, gsiSkValue?: string): Promise<DynamoDBItem[]>;
}
export declare const createDynamoDBHelper: (tableName: string) => DynamoDBHelper;
export declare const generatePK: (type: string, id: string) => string;
export declare const generateSK: (type: string, id: string) => string;
//# sourceMappingURL=dynamodb.d.ts.map