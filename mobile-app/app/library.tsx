import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { useApi } from '../hooks/useApi';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 60) / COLUMN_COUNT;

interface VideoItem {
  id: string;
  fileName: string;
  status: string;
  uploadedAt: string;
  duration?: number;
  thumbnailUrl?: string;
  faceCount?: number;
  orgId: string;
}

export default function LibraryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock data for now - replace with actual API call
  const mockVideos: VideoItem[] = [
    {
      id: '1',
      fileName: 'surveillance_001.mp4',
      status: 'PROCESSED',
      uploadedAt: '2025-08-11T18:31:33.524119',
      duration: 120,
      faceCount: 15,
      orgId: 'test-org',
    },
    {
      id: '2',
      fileName: 'camera_feed_002.mp4',
      status: 'PROCESSING',
      uploadedAt: '2025-08-11T17:45:22.123456',
      duration: 180,
      faceCount: 8,
      orgId: 'test-org',
    },
    {
      id: '3',
      fileName: 'security_003.mp4',
      status: 'PROCESSED',
      uploadedAt: '2025-08-11T16:20:15.789012',
      duration: 90,
      faceCount: 23,
      orgId: 'test-org',
    },
  ];

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await apiService.getVideos(user?.orgId);
      // setVideos(response.videos);
      
      // For now, use mock data
      setVideos(mockVideos);
    } catch (error) {
      console.error('Failed to load videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return '#34C759';
      case 'PROCESSING':
        return '#FF9500';
      case 'ERROR':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return 'checkmark-circle';
      case 'PROCESSING':
        return 'time';
      case 'ERROR':
        return 'alert-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const navigateToPlayback = (videoId: string) => {
    router.push(`/playback/${videoId}`);
  };

  const navigateToUpload = () => {
    router.push('/upload');
  };

  const filteredVideos = videos.filter(video => {
    if (filterStatus === 'all') return true;
    return video.status === filterStatus;
  });

  const renderGridItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => navigateToPlayback(item.id)}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Ionicons name="videocam" size={32} color="#8E8E93" />
          </View>
        )}
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={12} color="white" />
        </View>
        
        {/* Duration Badge */}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
        </View>
      </View>

      {/* Video Info */}
      <View style={styles.videoInfo}>
        <Text style={styles.fileName} numberOfLines={2}>
          {item.fileName}
        </Text>
        <Text style={styles.uploadDate}>{formatDate(item.uploadedAt)}</Text>
        {item.faceCount && (
          <View style={styles.faceCountContainer}>
            <Ionicons name="people" size={14} color="#8E8E93" />
            <Text style={styles.faceCountText}>{item.faceCount} faces</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigateToPlayback(item.id)}
    >
      {/* Thumbnail */}
      <View style={styles.listThumbnailContainer}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.listThumbnail} />
        ) : (
          <View style={styles.listPlaceholderThumbnail}>
            <Ionicons name="videocam" size={24} color="#8E8E93" />
          </View>
        )}
      </View>

      {/* Video Details */}
      <View style={styles.listVideoDetails}>
        <Text style={styles.listFileName} numberOfLines={1}>
          {item.fileName}
        </Text>
        <Text style={styles.listUploadDate}>{formatDate(item.uploadedAt)}</Text>
        <View style={styles.listMetadata}>
          <Text style={styles.listDuration}>{formatDuration(item.duration)}</Text>
          {item.faceCount && (
            <Text style={styles.listFaceCount}>• {item.faceCount} faces</Text>
          )}
        </View>
      </View>

      {/* Status */}
      <View style={styles.listStatusContainer}>
        <View style={[styles.listStatusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Ionicons name={getStatusIcon(item.status)} size={14} color="white" />
        </View>
        <Text style={styles.listStatusText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your videos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Video Library</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'grid' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons name="grid" size={20} color={viewMode === 'grid' ? '#007AFF' : '#8E8E93'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={20} color={viewMode === 'list' ? '#007AFF' : '#8E8E93'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'PROCESSED', 'PROCESSING', 'ERROR'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[
                styles.filterChipText,
                filterStatus === status && styles.filterChipTextActive
              ]}>
                {status === 'all' ? 'All' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Videos */}
      {filteredVideos.length > 0 ? (
        <FlatList
          data={filteredVideos}
          renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
          key={viewMode}
          numColumns={viewMode === 'grid' ? COLUMN_COUNT : 1}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.videosList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>No videos yet</Text>
          <Text style={styles.emptySubtitle}>
            {filterStatus === 'all' 
              ? 'Upload your first surveillance video to get started'
              : `No videos with status "${filterStatus}"`
            }
          </Text>
          {filterStatus === 'all' && (
            <TouchableOpacity style={styles.uploadButton} onPress={navigateToUpload}>
              <Ionicons name="cloud-upload" size={20} color="white" />
              <Text style={styles.uploadButtonText}>Upload Video</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Floating Upload Button */}
      <TouchableOpacity style={styles.floatingUploadButton} onPress={navigateToUpload}>
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c1c1e',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f2f2f7',
  },
  viewModeButtonActive: {
    backgroundColor: '#e0f2ff',
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  filterChip: {
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  videosList: {
    padding: 20,
  },
  gridItem: {
    width: ITEM_WIDTH,
    marginBottom: 20,
    marginRight: 20,
  },
  thumbnailContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  thumbnail: {
    width: '100%',
    height: ITEM_WIDTH * 9 / 16,
    borderRadius: 12,
  },
  placeholderThumbnail: {
    width: '100%',
    height: ITEM_WIDTH * 9 / 16,
    borderRadius: 12,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    borderRadius: 10,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  videoInfo: {
    gap: 4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
    lineHeight: 18,
  },
  uploadDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  faceCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  faceCountText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  listThumbnailContainer: {
    marginRight: 15,
  },
  listThumbnail: {
    width: 80,
    height: 45,
    borderRadius: 8,
  },
  listPlaceholderThumbnail: {
    width: 80,
    height: 45,
    borderRadius: 8,
    backgroundColor: '#f2f2f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listVideoDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  listFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  listUploadDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  listMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listDuration: {
    fontSize: 12,
    color: '#8E8E93',
  },
  listFaceCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  listStatusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 15,
  },
  listStatusBadge: {
    padding: 6,
    borderRadius: 12,
    marginBottom: 4,
  },
  listStatusText: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1c1c1e',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 30,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingUploadButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 15,
  },
});
