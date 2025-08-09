// Shared types for ZentriqVision Lambda functions

export interface User {
  userId: string;
  email: string;
  givenName: string;
  phone?: string;
  orgId: string;
  createdAt: string;
}

export interface Video {
  videoId: string;
  fileName: string;
  fileType: string;
  status: 'UPLOADING' | 'PROCESSING' | 'PROCESSED' | 'ERROR';
  orgId: string;
  userId: string;
  s3Key: string;
  uploadedAt: string;
  duration?: number;
  fileSize?: number;
  rekognitionJobId?: string;
}

export interface PersonDetection {
  personId: string;
  videoId: string;
  timestamp: string;
  confidence: number;
  attributes: {
    ageBucket?: string;
    gender?: string;
    emotion?: string;
    mask?: boolean;
    hairColor?: string;
    upperColor?: string;
    lowerColor?: string;
    objects?: string[];
  };
}

export interface Organization {
  orgId: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface ApiResponse<T = any> {
  statusCode: number;
  headers: {
    'Content-Type': string;
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Headers'?: string;
    'Access-Control-Allow-Methods'?: string;
  };
  body: string;
}

export interface DynamoDBItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  GSI3PK?: string;
  GSI3SK?: string;
  [key: string]: any;
}

export interface SearchFilters {
  color?: string;
  emotion?: string;
  ageBucket?: string;
  mask?: boolean;
  timeRange?: {
    start: string;
    end: string;
  };
  videoId?: string;
  personId?: string;
}

export interface UploadRequest {
  fileName: string;
  fileType: string;
  orgId: string;
  userId: string;
}

export interface SearchRequest {
  orgId: string;
  filters?: SearchFilters;
  limit?: number;
  nextToken?: string;
}
