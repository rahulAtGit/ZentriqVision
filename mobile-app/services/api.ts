// API service for ZentriqVision mobile app

import { env } from '../config/environment';

interface ApiResponse<T = any> {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

interface ApiError {
  error: string;
  message?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = env.apiUrl) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const config: RequestInit = {
      ...options,
      headers: defaultHeaders,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Video Upload
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
    return this.request('/upload', {
      method: 'POST',
      body: JSON.stringify(uploadRequest),
    });
  }

  // Search Videos and Detections
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
    const queryParams = new URLSearchParams();
    
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            queryParams.append(key, JSON.stringify(value));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }

    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    if (params.nextToken) {
      queryParams.append('nextToken', params.nextToken);
    }

    const endpoint = `/search?${queryParams.toString()}`;
    return this.request(endpoint);
  }

  // Get Video Details
  async getVideo(videoId: string, orgId: string): Promise<any> {
    return this.request(`/videos/${videoId}?orgId=${orgId}`);
  }

  // Get Video Playback URL
  async getVideoPlaybackUrl(videoId: string, orgId: string): Promise<{
    playbackUrl: string;
    videoDetails: any;
  }> {
    return this.request(`/videos/${videoId}/playback?orgId=${orgId}`);
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Export types for use in components
export type { ApiResponse, ApiError };
