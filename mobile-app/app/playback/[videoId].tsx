import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { PersonDetection } from '../../types';

const { width } = Dimensions.get('window');

export default function PlaybackScreen() {
  const { videoId } = useLocalSearchParams();
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock data for demonstration
  const mockDetections: PersonDetection[] = [
    {
      personId: 'person1',
      videoId: videoId as string,
      timestamp: '2024-01-15T10:30:00Z',
      confidence: 0.95,
      attributes: {
        ageBucket: '25-34',
        gender: 'male',
        emotion: 'neutral',
        mask: false,
        hairColor: 'black',
        upperColor: 'blue',
        lowerColor: 'black',
      },
    },
    {
      personId: 'person2',
      videoId: videoId as string,
      timestamp: '2024-01-15T10:32:00Z',
      confidence: 0.88,
      attributes: {
        ageBucket: '18-24',
        gender: 'female',
        emotion: 'happy',
        mask: false,
        hairColor: 'brown',
        upperColor: 'red',
        lowerColor: 'blue',
      },
    },
  ];

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
            source={{ uri: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            onPlaybackStatusUpdate={status => setStatus(status)}
          />
          
          {/* Custom Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={handlePlayPause}>
              <Ionicons 
                name={isPlaying ? 'pause' : 'play'} 
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
              <Text style={styles.infoText}>Duration: 2:30</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#8e8e93" />
              <Text style={styles.infoText}>Uploaded: {formatTimestamp('2024-01-15T10:00:00Z')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="people-outline" size={20} color="#8e8e93" />
              <Text style={styles.infoText}>Detections: {mockDetections.length}</Text>
            </View>
          </View>
        </View>

        {/* Detections */}
        <View style={styles.detectionsSection}>
          <Text style={styles.sectionTitle}>Detections</Text>
          {mockDetections.map((detection, index) => (
            <View key={`${detection.personId}-${index}`} style={styles.detectionCard}>
              <View style={styles.detectionHeader}>
                <Ionicons name="person" size={24} color="#007AFF" />
                <Text style={styles.detectionTitle}>Person {detection.personId}</Text>
                <Text style={styles.detectionConfidence}>
                  {(detection.confidence * 100).toFixed(0)}%
                </Text>
              </View>
              
              <View style={styles.detectionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Age:</Text>
                  <Text style={styles.detailValue}>{detection.attributes.ageBucket || 'Unknown'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gender:</Text>
                  <Text style={styles.detailValue}>{detection.attributes.gender || 'Unknown'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Emotion:</Text>
                  <Text style={styles.detailValue}>{detection.attributes.emotion || 'Unknown'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mask:</Text>
                  <Text style={styles.detailValue}>{detection.attributes.mask ? 'Yes' : 'No'}</Text>
                </View>
                {detection.attributes.upperColor && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Upper Color:</Text>
                    <Text style={styles.detailValue}>{detection.attributes.upperColor}</Text>
                  </View>
                )}
                {detection.attributes.lowerColor && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lower Color:</Text>
                    <Text style={styles.detailValue}>{detection.attributes.lowerColor}</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.detectionTimestamp}>
                Detected: {formatTimestamp(detection.timestamp)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 20,
  },
  videoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  video: {
    width: width - 40,
    height: (width - 40) * 9 / 16,
    borderRadius: 12,
  },
  controls: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    padding: 10,
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1c1c1e',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#1c1c1e',
    marginLeft: 10,
  },
  detectionsSection: {
    marginBottom: 20,
  },
  detectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginLeft: 8,
    flex: 1,
  },
  detectionConfidence: {
    fontSize: 14,
    color: '#8e8e93',
  },
  detectionDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8e8e93',
  },
  detailValue: {
    fontSize: 14,
    color: '#1c1c1e',
    fontWeight: '500',
  },
  detectionTimestamp: {
    fontSize: 12,
    color: '#8e8e93',
    fontStyle: 'italic',
  },
});
