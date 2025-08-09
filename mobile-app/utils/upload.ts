// Upload utilities for ZentriqVision mobile app

import * as FileSystem from 'expo-file-system';

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
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      const totalSize = fileInfo.size || 0;

      // Create upload task
      const uploadTask = FileSystem.createUploadTask(
        presignedUrl,
        fileUri,
        {
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          fieldName: 'file',
          mimeType: 'video/mp4',
        },
        (uploadProgress) => {
          if (onProgress) {
            onProgress({
              loaded: uploadProgress.totalBytesSent,
              total: totalSize,
              percentage: (uploadProgress.totalBytesSent / totalSize) * 100,
            });
          }
        }
      );

      // Start upload
      const result = await uploadTask.uploadAsync();

      if (result.status === 200) {
        return {
          success: true,
        };
      } else {
        throw new Error(`Upload failed with status: ${result.status}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
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
      console.error('Error getting file size:', error);
      return 0;
    }
  }

  /**
   * Validate video file
   */
  static validateVideoFile(fileUri: string, maxSizeMB: number = 500): {
    isValid: boolean;
    error?: string;
  } {
    // Check file extension
    const validExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
    const fileExtension = fileUri.toLowerCase().split('.').pop();

    if (!fileExtension || !validExtensions.includes(`.${fileExtension}`)) {
      return {
        isValid: false,
        error: 'Invalid file format. Supported formats: MP4, MOV, AVI, MKV',
      };
    }

    // Check file size (will be validated during upload)
    return { isValid: true };
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
