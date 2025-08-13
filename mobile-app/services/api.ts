// API service for ZentriqVision mobile app

import {
  env,
  apiEndpoints,
  uploadConfig,
  searchConfig,
} from "../config/environment";
import { authService } from "./auth";
import { mockApiService } from "./mockApi";

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
    // Use mock API only when explicitly configured
    this.useMockApi = env.useMockApi;

    if (env.enableDebugLogging) {
      console.log(`[API Service] Initialized with base URL: ${baseUrl}`);
      console.log(`[API Service] Mock API enabled: ${this.useMockApi}`);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // If using mock API, return mock data
    if (this.useMockApi) {
      if (env.enableDebugLogging) {
        console.log(`[MOCK API] ${options.method || "GET"} ${endpoint}`);
      }
      return this.handleMockRequest<T>(endpoint, options);
    }

    const url = `${this.baseUrl}${endpoint}`;

    if (env.enableDebugLogging) {
      console.log(`[API Request] ${options.method || "GET"} ${url}`);
    }

    // Get authentication token
    const accessToken = await authService.getAccessToken();

    const defaultHeaders = {
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options.headers,
    };

    const config: RequestInit = {
      ...options,
      headers: defaultHeaders,
    };

    try {
      const response = await fetch(url, config);

      if (env.enableDebugLogging) {
        console.log(`[API Response] ${response.status} ${response.statusText}`);
      }

      // Handle authentication errors
      if (response.status === 401) {
        // Token expired or invalid, redirect to auth
        await authService.signOut();
        throw new Error("Authentication expired. Please sign in again.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || `HTTP ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  private async handleMockRequest<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    // Handle mock requests based on endpoint and method
    switch (endpoint) {
      case apiEndpoints.upload:
        if (options.method === "POST") {
          const body = JSON.parse(options.body as string);
          return mockApiService.uploadVideo(body) as T;
        }
        break;

      case apiEndpoints.search:
        if (options.method === "GET") {
          const url = new URL(`${this.baseUrl}${endpoint}`);
          const params = {
            orgId: url.searchParams.get("orgId") || "test-org",
            filters: {
              color: url.searchParams.get("color") || undefined,
              emotion: url.searchParams.get("emotion") || undefined,
              ageBucket: url.searchParams.get("ageBucket") || undefined,
              mask: url.searchParams.get("mask") === "true",
            },
            limit: parseInt(
              url.searchParams.get("limit") ||
                searchConfig.defaultLimit.toString()
            ),
          };
          return mockApiService.searchDetections(params) as T;
        }
        break;

      default:
        if (endpoint.startsWith("/videos/")) {
          const videoId = endpoint.split("/")[2];
          const url = new URL(`${this.baseUrl}${endpoint}`);
          const orgId = url.searchParams.get("orgId") || "test-org";

          if (endpoint.includes("/playback")) {
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
    // Validate file type
    if (!uploadConfig.allowedVideoTypes.includes(uploadRequest.fileType)) {
      throw new Error(
        `Unsupported file type. Allowed types: ${uploadConfig.allowedVideoTypes.join(
          ", "
        )}`
      );
    }

    return this.request(apiEndpoints.upload, {
      method: "POST",
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
          if (typeof value === "object") {
            queryParams.append(key, JSON.stringify(value));
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }

    // Use configured limits
    const limit = Math.min(
      params.limit || searchConfig.defaultLimit,
      searchConfig.maxLimit
    );
    queryParams.append("limit", limit.toString());

    if (params.nextToken) {
      queryParams.append("nextToken", params.nextToken.toString());
    }

    const endpoint = `${apiEndpoints.search}?${queryParams.toString()}`;
    return this.request(endpoint);
  }

  // Get Video Details
  async getVideo(videoId: string, orgId: string): Promise<any> {
    return this.request(`${apiEndpoints.videos}/${videoId}?orgId=${orgId}`);
  }

  // Get Videos for Organization
  async getVideos(
    orgId: string,
    filters?: {
      status?: string;
      limit?: number;
      nextToken?: string;
    }
  ): Promise<{
    results: any[]; // Changed from 'videos' to 'results' to match search Lambda
    count: number;
    nextToken?: string;
  }> {
    const queryParams = new URLSearchParams();

    if (filters?.status && filters.status !== "all") {
      queryParams.append("status", filters.status);
    }

    if (filters?.limit) {
      queryParams.append("limit", filters.limit.toString());
    }

    if (filters?.nextToken) {
      queryParams.append("nextToken", filters.nextToken);
    }

    const endpoint = `${
      apiEndpoints.videos
    }?orgId=${orgId}&${queryParams.toString()}`;
    return this.request(endpoint);
  }

  // Get Video Playback URL
  async getVideoPlaybackUrl(
    videoId: string,
    orgId: string
  ): Promise<{
    playbackUrl: string;
    videoDetails: any;
  }> {
    return this.request(
      `${apiEndpoints.videos}/${videoId}/playback?orgId=${orgId}`
    );
  }

  // Get User Profile
  async getUserProfile(): Promise<any> {
    return this.request(apiEndpoints.user.profile);
  }

  // Update User Profile
  async updateUserProfile(profileData: any): Promise<any> {
    return this.request(apiEndpoints.user.profile, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  // Health check endpoint
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request("/health");
  }
}

// Create singleton instance
export const apiService = new ApiService();

// Export types for use in components
export type { ApiResponse, ApiError };
