// Mock API service for testing ZentriqVision mobile app

import { TEST_CONFIG } from '../config/test-config';

interface MockApiResponse<T = any> {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

class MockApiService {
  private delay(ms: number = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock video upload
  async uploadVideo(uploadRequest: {
    fileName: string;
    fileType: string;
    orgId: string;
    userId: string;
  }): Promise<{
    videoId: string;
    presignedUrl: string;
    s3Key: string;
    status: string;
  }> {
    await this.delay(2000); // Simulate network delay
    
    const videoId = `video_${Date.now()}`;
    const s3Key = `${uploadRequest.orgId}/videos/${videoId}/${uploadRequest.fileName}`;
    
    return {
      videoId,
      presignedUrl: `https://mock-s3-url.s3.amazonaws.com/${s3Key}`,
      s3Key,
      status: 'UPLOADING',
    };
  }

  // Mock search detections
  async searchDetections(params: {
    orgId: string;
    filters?: {
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
    };
    limit?: number;
    nextToken?: string;
  }): Promise<{
    results: any[];
    count: number;
    orgId: string;
    filters: any;
  }> {
    await this.delay(1000); // Simulate network delay
    
    let results = [...TEST_CONFIG.testDetections];
    
    // Apply filters
    if (params.filters) {
      if (params.filters.color) {
        results = results.filter(detection => 
          detection.attributes.upperColor === params.filters?.color ||
          detection.attributes.lowerColor === params.filters?.color
        );
      }
      
      if (params.filters.emotion) {
        results = results.filter(detection => 
          detection.attributes.emotion === params.filters?.emotion
        );
      }
      
      if (params.filters.ageBucket) {
        results = results.filter(detection => 
          detection.attributes.ageBucket === params.filters?.ageBucket
        );
      }
    }
    
    return {
      results,
      count: results.length,
      orgId: params.orgId,
      filters: params.filters || {},
    };
  }

  // Mock get video details
  async getVideo(videoId: string, orgId: string): Promise<any> {
    await this.delay(500); // Simulate network delay
    
    return {
      videoId,
      fileName: TEST_CONFIG.testVideo.fileName,
      status: 'PROCESSED',
      duration: TEST_CONFIG.testVideo.duration,
      uploadedAt: new Date().toISOString(),
      detections: TEST_CONFIG.testDetections,
    };
  }

  // Mock get video playback URL
  async getVideoPlaybackUrl(videoId: string, orgId: string): Promise<{
    playbackUrl: string;
    videoDetails: any;
  }> {
    await this.delay(500); // Simulate network delay
    
    return {
      playbackUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
      videoDetails: {
        videoId,
        fileName: TEST_CONFIG.testVideo.fileName,
        status: 'PROCESSED',
        duration: TEST_CONFIG.testVideo.duration,
      },
    };
  }
}

// Create singleton instance
export const mockApiService = new MockApiService();

export default mockApiService;
