// Upload utilities for ZentriqVision mobile app

import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  error?: string;
  videoId?: string;
}

export class UploadManager {
  /**
   * Upload video file to S3 using presigned URL
   */
  static async uploadVideoToS3(
    fileUri: string,
    presignedUrl: string,
    onProgress?: (progress: UploadProgress) => void,
    contentType?: string
  ): Promise<UploadResult> {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error("File does not exist");
      }

      const totalSize = fileInfo.size || 0;
      console.log(`Starting upload: ${totalSize} bytes`);

      // Read file as base64 for fetch upload
      const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array
      const fileBytes = new Uint8Array(Buffer.from(fileBase64, "base64"));

      // Use fetch with proper headers for S3 presigned URL
      const response = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType || "video/mp4",
        },
        body: fileBytes,
      });

      if (response.ok) {
        console.log("Upload completed successfully");
        return {
          success: true,
        };
      } else {
        const errorText = await response.text();
        console.error(
          `Upload failed with status: ${response.status}, response: ${errorText}`
        );
        throw new Error(`Upload failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Upload failed:", error);

      // Provide more specific error messages
      let errorMessage = "Upload failed";
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage =
            "Upload timed out. Please check your connection and try again.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection.";
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get file size in MB
   */
  static async getFileSize(fileUri: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      return fileInfo.exists ? (fileInfo.size || 0) / (1024 * 1024) : 0;
    } catch (error) {
      console.error("Error getting file size:", error);
      return 0;
    }
  }

  /**
   * Validate video file
   */
  static validateVideoFile(
    fileUri: string,
    maxSizeMB: number = 500
  ): {
    isValid: boolean;
    error?: string;
  } {
    // Check file extension
    const validExtensions = [".mp4", ".mov", ".avi", ".mkv"];
    const fileExtension = fileUri.toLowerCase().split(".").pop();

    if (!fileExtension || !validExtensions.includes(`.${fileExtension}`)) {
      return {
        isValid: false,
        error: "Invalid file format. Supported formats: MP4, MOV, AVI, MKV",
      };
    }

    // Check file size (will be validated during upload)
    return { isValid: true };
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}
