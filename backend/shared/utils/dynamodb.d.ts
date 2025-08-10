import { DynamoDBItem } from '../types';
export declare class DynamoDBHelper {
    private tableName;
    constructor(tableName: string);
    get(pk: string, sk: string): Promise<DynamoDBItem | null>;
    put(item: DynamoDBItem): Promise<void>;
    update(pk: string, sk: string, updateExpression: string, expressionAttributeNames: Record<string, string>, expressionAttributeValues: Record<string, any>): Promise<void>;
    delete(pk: string, sk: string): Promise<void>;
    queryGSI(indexName: string, pk: string): Promise<DynamoDBItem[]>;
    query(pk: string): Promise<DynamoDBItem[]>;
}
export declare const createDynamoDBHelper: (tableName: string) => DynamoDBHelper;
export declare const generatePK: (type: string, id: string) => string;
export declare const generateSK: (type: string, id: string) => string;
//# sourceMappingURL=dynamodb.d.ts.map