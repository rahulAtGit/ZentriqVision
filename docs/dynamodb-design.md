# DynamoDB Single-Table Design for ZentriqVision

## Overview

Our video surveillance app uses a single-table design in DynamoDB to efficiently store and query all data types while maintaining excellent performance and cost efficiency.

## Table Structure

**Table Name**: `zentriqvision-data`

### Primary Key Structure

- **Partition Key (PK)**: `STRING` - Determines data distribution
- **Sort Key (SK)**: `STRING` - Determines ordering within partition

### Global Secondary Indexes (GSIs)

1. **AttributeIndex** (GSI1)

   - Partition Key: `GSI1PK` - Attribute-based queries
   - Sort Key: `GSI1SK` - Time-based sorting

2. **VideoIndex** (GSI2)

   - Partition Key: `GSI2PK` - Video-based queries
   - Sort Key: `GSI2SK` - Time-based sorting

3. **TimeIndex** (GSI3)
   - Partition Key: `GSI3PK` - Date-based queries
   - Sort Key: `GSI3SK` - Time-based sorting

## Data Access Patterns

### 1. Organization Management

```typescript
// Get organization details
PK: "ORG#org123";
SK: "ORG#org123";

// Get all users in organization
PK: "ORG#org123";
SK: begins_with("USER#");

// Get all videos in organization
PK: "ORG#org123";
SK: begins_with("VIDEO#");
```

### 2. User Management

```typescript
// Get user details
PK: "ORG#org123";
SK: "USER#user456";

// Get all videos by user
PK: "ORG#org123";
SK: begins_with("VIDEO#"); // Filter by userId in app
```

### 3. Video Management

```typescript
// Get video metadata
PK: "ORG#org123";
SK: "VIDEO#video789";

// Get all appearances in video (using GSI2)
GSI2PK: "VIDEO#video789";
GSI2SK: begins_with("APPEAR#");
```

### 4. Person Detection

```typescript
// Get all appearances of a person
PK: "ORG#org123";
SK: begins_with("APPEAR#"); // Filter by personId in app

// Get person details
PK: "ORG#org123";
SK: "PERSON#person001";
```

### 5. Attribute-Based Search

```typescript
// Find all people wearing blue shirts (using GSI1)
GSI1PK: "ATTR#color#blue"
GSI1SK: > "APPEAR#20240101T090000Z" // Last hour

// Find all happy people
GSI1PK: "ATTR#emotion#happy"
GSI1SK: > "APPEAR#20240101T090000Z"
```

### 6. Time-Based Queries

```typescript
// Find all detections in last 24 hours (using GSI3)
GSI3PK: "TIME#20240101"
GSI3SK: > "APPEAR#20240101T000000Z"
```

## Example Data Items

### Organization

```json
{
  "PK": "ORG#org123",
  "SK": "ORG#org123",
  "orgId": "org123",
  "name": "Acme Corporation",
  "createdAt": "2024-01-01T00:00:00Z",
  "status": "ACTIVE"
}
```

### User

```json
{
  "PK": "ORG#org123",
  "SK": "USER#user456",
  "userId": "user456",
  "email": "user@example.com",
  "givenName": "John",
  "phone": "+1234567890",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### Video

```json
{
  "PK": "ORG#org123",
  "SK": "VIDEO#video789",
  "videoId": "video789",
  "fileName": "camera1_20240101.mp4",
  "status": "PROCESSED",
  "uploadedAt": "2024-01-01T10:00:00Z",
  "s3Key": "org123/videos/video789.mp4",
  "duration": 300,
  "fileSize": 50000000
}
```

### Person Detection

```json
{
  "PK": "ORG#org123",
  "SK": "PERSON#person001",
  "personId": "person001",
  "firstSeen": "2024-01-01T10:05:00Z",
  "lastSeen": "2024-01-01T10:15:00Z",
  "totalAppearances": 5,
  "attributes": {
    "ageBucket": "25-35",
    "gender": "male",
    "hairColor": "brown",
    "upperColor": "blue",
    "lowerColor": "black"
  }
}
```

### Person Appearance

```json
{
  "PK": "ORG#org123",
  "SK": "APPEAR#video789#20240101T100500Z",
  "personId": "person001",
  "videoId": "video789",
  "timestamp": "2024-01-01T10:05:00Z",
  "confidence": 0.95,
  "attributes": {
    "emotion": "neutral",
    "mask": false,
    "objects": ["phone", "bag"]
  },
  "GSI1PK": "ATTR#color#blue",
  "GSI1SK": "APPEAR#20240101T100500Z",
  "GSI2PK": "VIDEO#video789",
  "GSI2SK": "APPEAR#20240101T100500Z",
  "GSI3PK": "TIME#20240101",
  "GSI3SK": "APPEAR#20240101T100500Z"
}
```

## Query Examples

### 1. Find all people wearing blue shirts in the last hour

```typescript
// Query GSI1
const params = {
  IndexName: "AttributeIndex",
  KeyConditionExpression: "GSI1PK = :pk AND GSI1SK > :sk",
  ExpressionAttributeValues: {
    ":pk": "ATTR#color#blue",
    ":sk": "APPEAR#20240101T090000Z",
  },
};
```

### 2. Find all detections in a specific video

```typescript
// Query GSI2
const params = {
  IndexName: "VideoIndex",
  KeyConditionExpression: "GSI2PK = :pk",
  ExpressionAttributeValues: {
    ":pk": "VIDEO#video789",
  },
};
```

### 3. Find all detections in the last 24 hours

```typescript
// Query GSI3
const params = {
  IndexName: "TimeIndex",
  KeyConditionExpression: "GSI3PK = :pk AND GSI3SK > :sk",
  ExpressionAttributeValues: {
    ":pk": "TIME#20240101",
    ":sk": "APPEAR#20240101T000000Z",
  },
};
```

## Benefits of This Design

1. **Performance**: Single query for related data
2. **Cost Efficiency**: Fewer tables, optimized queries
3. **Scalability**: Even data distribution across partitions
4. **Flexibility**: Multiple access patterns supported
5. **Consistency**: Atomic transactions within table
6. **Simplicity**: No complex joins or relationships

## Considerations

1. **Data Modeling**: Requires upfront planning of access patterns
2. **Index Costs**: GSIs add storage and write costs
3. **Query Complexity**: Need to understand key structure
4. **Migration**: Schema changes require data migration
5. **Monitoring**: Need to monitor GSI usage and costs
