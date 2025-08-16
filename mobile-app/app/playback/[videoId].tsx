import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { useAuthStore } from "../../hooks/useAuthStore";
import { useApi } from "../../hooks/useApi";
import { Ionicons } from "@expo/vector-icons";
import { PersonDetection } from "../../types";
import { useQueryClient } from "@tanstack/react-query";

const { width } = Dimensions.get("window");

export default function PlaybackScreen() {
  const { videoId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { useVideoDetails, useVideoPlayback } = useApi();
  const queryClient = useQueryClient();

  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);

  // Fetch video details and playback URL
  const {
    data: videoData,
    isLoading: videoLoading,
    error: videoError,
  } = useVideoDetails(videoId as string);

  const {
    data: playbackData,
    isLoading: playbackLoading,
    error: playbackError,
  } = useVideoPlayback(videoId as string);

  // Auto-refresh for processing videos
  useEffect(() => {
    if (videoData?.status === "PROCESSING") {
      const interval = setInterval(() => {
        console.log("Auto-refreshing video status...");
        queryClient.invalidateQueries({ queryKey: ["video", videoId] });
        queryClient.invalidateQueries({
          queryKey: ["video-playback", videoId],
        });
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [videoData?.status, videoId, queryClient]);

  const handlePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (videoError || playbackError) {
    // Check for specific error types
    const errorMessage = videoError?.message || playbackError?.message || "";
    const isVideoNotReady =
      errorMessage.includes("Video is not ready for playback") ||
      errorMessage.includes("not ready for playback");
    const isAuthError =
      errorMessage.includes("Authentication") ||
      errorMessage.includes("authorization") ||
      errorMessage.includes("403") ||
      errorMessage.includes("401");

    if (isVideoNotReady) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="time-outline" size={48} color="#FF9500" />
          <Text style={styles.errorText}>Video Processing</Text>
          <Text style={styles.errorSubtext}>
            This video is still being processed and is not ready for playback
            yet.
          </Text>
          <Text style={styles.errorSubtext}>
            Please check back in a few minutes.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isAuthError) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>Authentication Error</Text>
          <Text style={styles.errorSubtext}>
            Your session has expired. Please sign in again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Generic error
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Failed to load video</Text>
        <Text style={styles.errorSubtext}>
          {errorMessage || "Please try again later"}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (videoLoading || playbackLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  const videoDetails = videoData || {};
  const playbackUrl =
    playbackData?.playbackUrl ||
    "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4";
  const detections = videoDetails.detections || [];

  // Check if video is ready for playback
  const videoStatus = videoDetails.status;
  const isVideoReady = videoStatus === "PROCESSED";
  const isVideoProcessing = videoStatus === "PROCESSING";
  const isVideoError = videoStatus === "ERROR";

  // Show processing status if video is not ready
  if (isVideoProcessing) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="time-outline" size={48} color="#FF9500" />
        <Text style={styles.errorText}>Video Processing</Text>
        <Text style={styles.errorSubtext}>
          This video is currently being processed. Please wait...
        </Text>
        <Text style={styles.errorSubtext}>Status: {videoStatus}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.retryButton, styles.refreshButton]}
            onPress={() => {
              // Refresh the video details and playback data
              queryClient.invalidateQueries({ queryKey: ["video", videoId] });
              queryClient.invalidateQueries({
                queryKey: ["video-playback", videoId],
              });
            }}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.retryButtonText}>Check Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isVideoError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Video Processing Failed</Text>
        <Text style={styles.errorSubtext}>
          This video encountered an error during processing.
        </Text>
        <Text style={styles.errorSubtext}>Status: {videoStatus}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.retryButton, styles.refreshButton]}
            onPress={() => {
              queryClient.invalidateQueries({ queryKey: ["video", videoId] });
              queryClient.invalidateQueries({
                queryKey: ["video-playback", videoId],
              });
            }}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isVideoReady) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="help-circle" size={48} color="#8E8E93" />
        <Text style={styles.errorText}>Video Not Ready</Text>
        <Text style={styles.errorSubtext}>
          This video is not ready for playback yet.
        </Text>
        <Text style={styles.errorSubtext}>
          Status: {videoStatus || "Unknown"}
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.retryButton, styles.refreshButton]}
            onPress={() => {
              queryClient.invalidateQueries({ queryKey: ["video", videoId] });
              queryClient.invalidateQueries({
                queryKey: ["video-playback", videoId],
              });
            }}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.retryButtonText}>Check Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Video Playback</Text>
        <Text style={styles.subtitle}>Video ID: {videoId}</Text>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: playbackUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            onPlaybackStatusUpdate={(status) => setStatus(status)}
          />

          {/* Custom Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handlePlayPause}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Video Info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Video Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#8e8e93" />
              <Text style={styles.infoText}>
                Duration: {videoDetails.duration || "Unknown"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#8e8e93" />
              <Text style={styles.infoText}>
                Uploaded:{" "}
                {videoDetails.uploadedAt
                  ? formatTimestamp(videoDetails.uploadedAt)
                  : "Unknown"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={20} color="#8e8e93" />
              <Text style={styles.infoText}>
                Detections: {detections.length}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#8e8e93"
              />
              <Text style={styles.infoText}>
                Status: {videoDetails.status || "Unknown"}
              </Text>
            </View>
          </View>
        </View>

        {/* Detections */}
        <View style={styles.detectionsSection}>
          <Text style={styles.sectionTitle}>Detections</Text>
          {detections.length > 0 ? (
            detections.map((detection: PersonDetection, index: number) => (
              <View
                key={`${detection.personId}-${index}`}
                style={styles.detectionCard}
              >
                <View style={styles.detectionHeader}>
                  <Ionicons name="person" size={24} color="#007AFF" />
                  <Text style={styles.detectionTitle}>
                    Person {detection.personId}
                  </Text>
                  <Text style={styles.detectionConfidence}>
                    {(detection.confidence * 100).toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.detectionDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Age:</Text>
                    <Text style={styles.detailValue}>
                      {detection.attributes.ageBucket || "Unknown"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Gender:</Text>
                    <Text style={styles.detailValue}>
                      {detection.attributes.gender || "Unknown"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Emotion:</Text>
                    <Text style={styles.detailValue}>
                      {detection.attributes.emotion || "Unknown"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mask:</Text>
                    <Text style={styles.detailValue}>
                      {detection.attributes.mask ? "Yes" : "No"}
                    </Text>
                  </View>
                  {detection.attributes.upperColor && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Upper Color:</Text>
                      <Text style={styles.detailValue}>
                        {detection.attributes.upperColor}
                      </Text>
                    </View>
                  )}
                  {detection.attributes.lowerColor && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Lower Color:</Text>
                      <Text style={styles.detailValue}>
                        {detection.attributes.lowerColor}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.detectionTimestamp}>
                  Detected: {formatTimestamp(detection.timestamp)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.noDetectionsContainer}>
              <Ionicons name="people-outline" size={48} color="#8e8e93" />
              <Text style={styles.noDetectionsText}>No detections found</Text>
              <Text style={styles.noDetectionsSubtext}>
                This video hasn't been processed yet or no people were detected
              </Text>
            </View>
          )}
        </View>
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
    marginBottom: 20,
  },
  videoContainer: {
    position: "relative",
    marginBottom: 20,
  },
  video: {
    width: width - 40,
    height: ((width - 40) * 9) / 16,
    borderRadius: 12,
  },
  controls: {
    position: "absolute",
    bottom: 10,
    left: 10,
  },
  controlButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
    padding: 10,
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    color: "#1c1c1e",
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: "#1c1c1e",
    marginLeft: 10,
  },
  detectionsSection: {
    marginBottom: 20,
  },
  detectionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1c1c1e",
    marginLeft: 8,
    flex: 1,
  },
  detectionConfidence: {
    fontSize: 14,
    color: "#8e8e93",
  },
  detectionDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: "#8e8e93",
  },
  detailValue: {
    fontSize: 14,
    color: "#1c1c1e",
    fontWeight: "500",
  },
  detectionTimestamp: {
    fontSize: 12,
    color: "#8e8e93",
    fontStyle: "italic",
  },
  noDetectionsContainer: {
    alignItems: "center",
    padding: 40,
  },
  noDetectionsText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#8e8e93",
    marginTop: 15,
    marginBottom: 5,
  },
  noDetectionsSubtext: {
    fontSize: 14,
    color: "#8e8e93",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#8e8e93",
    marginTop: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1c1c1e",
    marginTop: 15,
    marginBottom: 5,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#8e8e93",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF9500",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
