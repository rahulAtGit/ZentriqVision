import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../hooks/useAuthStore";
import { useApi } from "../hooks/useApi";
import { UploadManager, UploadProgress } from "../utils/upload";
import { Ionicons } from "@expo/vector-icons";

// Helper function to determine MIME type based on file extension
const getMimeType = (fileName: string, uri: string, fallbackType?: string) => {
  // Try to get extension from filename first
  let extension = fileName ? fileName.toLowerCase().split(".").pop() : null;

  // If no extension from filename, try to get it from URI
  if (!extension) {
    const uriParts = uri.split(".");
    extension =
      uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : null;
  }

  const mimeTypes: { [key: string]: string } = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
  };

  if (extension && mimeTypes[extension]) {
    return mimeTypes[extension];
  }

  // Fallback to the type from ImagePicker or default
  return fallbackType || "video/mp4";
};

export default function UploadScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { useUploadVideo } = useApi();
  const uploadVideoMutation = useUploadVideo();

  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pickVideo = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant permission to access your media library"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 300, // 5 minutes max
      });

      if (!result.canceled && result.assets[0]) {
        const video = result.assets[0];

        // Debug: Log what ImagePicker actually returned
        console.log("ImagePicker result:", {
          fileName: video.fileName,
          uri: video.uri,
          type: video.type,
          fileSize: video.fileSize,
          width: video.width,
          height: video.height,
          duration: video.duration,
        });

        // Validate video file
        const validation = UploadManager.validateVideoFile(video.uri);
        if (!validation.isValid) {
          Alert.alert(
            "Invalid File",
            validation.error || "Please select a valid video file"
          );
          return;
        }

        setSelectedVideo(video);
        setUploadError(null); // Clear any previous errors
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick video");
    }
  };

  const uploadVideo = async () => {
    if (!selectedVideo) {
      Alert.alert("Error", "Please select a video first");
      return;
    }

    if (!user) {
      Alert.alert("Error", "Please sign in to upload videos");
      return;
    }

    setUploading(true);
    setUploadProgress(null);

    try {
      // Step 1: Get presigned URL from our API

      // Try to get a better filename from the URI if ImagePicker's filename is generic
      const getBetterFileName = (originalName: string, uri: string) => {
        if (originalName && originalName !== "19" && originalName !== "video") {
          return originalName;
        }

        // Extract filename from URI
        const uriParts = uri.split("/");
        const lastPart = uriParts[uriParts.length - 1];

        // If URI has a meaningful filename, use it
        if (lastPart && lastPart.includes(".") && lastPart !== "19") {
          return lastPart;
        }

        // Fallback to timestamp-based name
        return `video_${Date.now()}.mp4`;
      };

      const uploadData = {
        fileName: getBetterFileName(
          selectedVideo.fileName || "",
          selectedVideo.uri
        ),
        fileType: getMimeType(
          selectedVideo.fileName || "",
          selectedVideo.uri,
          selectedVideo.type
        ),
        orgId: user?.orgId || "default-org",
        userId: user?.userId || "unknown",
      };

      // Debug logging
      console.log("Upload data:", uploadData);
      console.log("Selected video:", selectedVideo);
      console.log("File type validation:", {
        fileName: selectedVideo.fileName,
        originalType: selectedVideo.type,
        computedType: uploadData.fileType,
        allowedTypes: ["video/mp4", "video/quicktime", "video/x-msvideo"],
      });

      // Additional debugging for file details
      console.log("File details:", {
        uri: selectedVideo.uri,
        fileName: selectedVideo.fileName,
        fileSize: selectedVideo.fileSize,
        type: selectedVideo.type,
        width: selectedVideo.width,
        height: selectedVideo.height,
        duration: selectedVideo.duration,
      });

      // Check if we can extract extension from URI
      const uriParts = selectedVideo.uri.split(".");
      const uriExtension =
        uriParts.length > 1 ? uriParts[uriParts.length - 1] : "no-extension";
      console.log("URI analysis:", {
        uri: selectedVideo.uri,
        uriExtension: uriExtension,
        fileNameExtension: selectedVideo.fileName
          ? selectedVideo.fileName.split(".").pop()
          : "no-filename",
      });

      const uploadResponse = await uploadVideoMutation.mutateAsync(uploadData);

      if (!uploadResponse.presignedUrl) {
        throw new Error("Failed to get upload URL");
      }

      console.log("Got presigned URL, starting S3 upload...");
      console.log(
        "Presigned URL:",
        uploadResponse.presignedUrl.substring(0, 100) + "..."
      );

      // Check if we can reach the S3 endpoint
      try {
        const url = new URL(uploadResponse.presignedUrl);
        console.log("S3 endpoint:", url.origin);
        console.log("S3 path:", url.pathname);
      } catch (e) {
        console.log("Could not parse presigned URL");
      }

      // Step 2: Upload to S3 using presigned URL
      const uploadResult = await UploadManager.uploadVideoToS3(
        selectedVideo.uri,
        uploadResponse.presignedUrl,
        (progress) => {
          setUploadProgress(progress);
          console.log(
            `Upload progress: ${progress.percentage.toFixed(1)}% (${
              progress.loaded
            }/${progress.total} bytes)`
          );
        },
        uploadData.fileType // Pass the content type from the original request
      );

      if (uploadResult.success) {
        Alert.alert(
          "Success",
          "Video uploaded successfully! It will be processed shortly.",
          [
            {
              text: "OK",
              onPress: () => {
                setSelectedVideo(null);
                setUploadProgress(null);
                router.back();
              },
            },
          ]
        );
      } else {
        // Check if it's a timeout error and suggest retry
        if (uploadResult.error?.includes("timeout")) {
          console.log("Upload timed out - this might be a network issue");
          console.log("Suggesting user to check network and retry");
        }
        throw new Error(uploadResult.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload video";
      setUploadError(errorMessage);
      // Also show alert for immediate feedback
      Alert.alert("Error", errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const formatProgress = (progress: UploadProgress) => {
    return `${progress.percentage.toFixed(1)}%`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Upload Video</Text>
        <Text style={styles.subtitle}>
          Select a surveillance video to upload and process
        </Text>

        {/* Video Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Video</Text>

          {selectedVideo ? (
            <View style={styles.selectedVideo}>
              <Ionicons name="videocam" size={48} color="#007AFF" />
              <Text style={styles.videoName}>
                {selectedVideo.fileName || "Selected Video"}
              </Text>
              <Text style={styles.videoSize}>
                {UploadManager.formatFileSize(selectedVideo.fileSize || 0)}
              </Text>
              <Text style={styles.videoType}>
                Type: {selectedVideo.type || "Unknown"} | Detected:{" "}
                {getMimeType(
                  selectedVideo.fileName || "",
                  selectedVideo.uri,
                  selectedVideo.type
                )}
              </Text>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={pickVideo}
                disabled={uploading}
              >
                <Text style={styles.changeButtonText}>Change Video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadArea} onPress={pickVideo}>
              <Ionicons name="cloud-upload-outline" size={64} color="#8e8e93" />
              <Text style={styles.uploadText}>Tap to select video</Text>
              <Text style={styles.uploadSubtext}>
                Supports MP4, MOV, AVI, MKV (max 5 minutes)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Upload Progress */}
        {uploadProgress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Progress</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${uploadProgress.percentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {formatProgress(uploadProgress)} -{" "}
                {UploadManager.formatFileSize(uploadProgress.loaded)} /{" "}
                {UploadManager.formatFileSize(uploadProgress.total)}
              </Text>
            </View>
          </View>
        )}

        {/* Upload Error Banner */}
        {uploadError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={styles.errorText}>Upload error: {uploadError}</Text>
            <View style={styles.errorActions}>
              {uploadError.includes("timeout") && (
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={uploadVideo}
                  disabled={uploading}
                >
                  <Text style={styles.retryButtonText}>Retry Upload</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.errorCloseButton}
                onPress={() => setUploadError(null)}
              >
                <Ionicons name="close" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Upload Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Settings</Text>
          <View style={styles.settingItem}>
            <Ionicons name="settings-outline" size={20} color="#8e8e93" />
            <Text style={styles.settingText}>AI Processing: Enabled</Text>
          </View>
          <View style={styles.settingItem}>
            <Ionicons name="time-outline" size={20} color="#8e8e93" />
            <Text style={styles.settingText}>Processing Time: 2-5 minutes</Text>
          </View>
          <View style={styles.settingItem}>
            <Ionicons name="shield-outline" size={20} color="#8e8e93" />
            <Text style={styles.settingText}>Privacy: Secure upload</Text>
          </View>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!selectedVideo || uploading) && styles.uploadButtonDisabled,
          ]}
          onPress={uploadVideo}
          disabled={!selectedVideo || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={24} color="white" />
              <Text style={styles.uploadButtonText}>Upload Video</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1c1c1e",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#8e8e93",
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    color: "#1c1c1e",
  },
  uploadArea: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e5ea",
    borderStyle: "dashed",
  },
  uploadText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1c1c1e",
    marginTop: 15,
    marginBottom: 5,
  },
  uploadSubtext: {
    fontSize: 14,
    color: "#8e8e93",
    textAlign: "center",
  },
  selectedVideo: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  videoName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1c1c1e",
    marginTop: 10,
    marginBottom: 5,
  },
  videoSize: {
    fontSize: 14,
    color: "#8e8e93",
    marginBottom: 15,
  },
  videoType: {
    fontSize: 12,
    color: "#007AFF",
    marginBottom: 15,
    fontFamily: "monospace",
    textAlign: "center",
  },
  changeButton: {
    backgroundColor: "#f2f2f7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changeButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
  progressContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f2f2f7",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#8e8e93",
    textAlign: "center",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingText: {
    fontSize: 16,
    color: "#1c1c1e",
    marginLeft: 10,
  },
  uploadButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadButtonDisabled: {
    backgroundColor: "#8e8e93",
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    color: "#FF3B30",
    fontSize: 14,
    marginLeft: 10,
  },
  errorCloseButton: {
    padding: 5,
  },
  errorActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
