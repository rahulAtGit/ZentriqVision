// API service for ZentriqVision mobile app

import { env } from '../config/environment';
import { mockApiService } from './mockApi';

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
  private useMockApi: boolean;

  constructor(baseUrl: string = env.apiUrl) {
    this.baseUrl = baseUrl;
    // Use mock API in development or when explicitly configured
    this.useMockApi = env.environment === 'development' || process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // If using mock API, return mock data
    if (this.useMockApi) {
      console.log(`[MOCK API] ${options.method || 'GET'} ${endpoint}`);
      return this.handleMockRequest<T>(endpoint, options);
    }

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

  private async handleMockRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    // Handle mock requests based on endpoint and method
    switch (endpoint) {
      case '/upload':
        if (options.method === 'POST') {
          const body = JSON.parse(options.body as string);
          return mockApiService.uploadVideo(body) as T;
        }
        break;
      
      case '/search':
        if (options.method === 'GET') {
          const url = new URL(`${this.baseUrl}${endpoint}`);
          const params = {
            orgId: url.searchParams.get('orgId') || 'test-org',
            filters: {
              color: url.searchParams.get('color') || undefined,
              emotion: url.searchParams.get('emotion') || undefined,
              ageBucket: url.searchParams.get('ageBucket') || undefined,
              mask: url.searchParams.get('mask') === 'true',
            },
            limit: parseInt(url.searchParams.get('limit') || '50'),
          };
          return mockApiService.searchDetections(params) as T;
        }
        break;
      
      default:
        if (endpoint.startsWith('/videos/')) {
          const videoId = endpoint.split('/')[2];
          const url = new URL(`${this.baseUrl}${endpoint}`);
          const orgId = url.searchParams.get('orgId') || 'test-org';
          
          if (endpoint.includes('/playback')) {
            return mockApiService.getVideoPlaybackUrl(videoId, orgId) as T;
          } else {
            return mockApiService.getVideo(videoId, orgId) as T;
          }
        }
        break;
    }
    
    throw new Error(`Mock API: Endpoint ${endpoint} not implemented`);
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
