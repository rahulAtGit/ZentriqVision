import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { useApi } from '../hooks/useApi';
import { TEST_CONFIG } from '../config/test-config';
import { Ionicons } from '@expo/vector-icons';

export default function TestScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuthStore();
  const { useUploadVideo, useSearchDetections, useVideoDetails } = useApi();
  
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const uploadVideoMutation = useUploadVideo();
  const searchDetectionsQuery = useSearchDetections({}, 10);
  const videoDetailsQuery = useVideoDetails('test-video-1');

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const runAuthenticationTests = async () => {
    setIsRunningTests(true);
    addTestResult('Starting authentication tests...');

    try {
      // Test 1: Check authentication state
      addTestResult(`Authentication state: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
      
      if (isAuthenticated) {
        addTestResult(`User: ${user?.givenName} (${user?.email})`);
      } else {
        // Test 2: Try to sign in with test credentials
        addTestResult('Attempting to sign in with test credentials...');
        await signIn({
          email: TEST_CONFIG.testUser.email,
          password: TEST_CONFIG.testUser.password,
        });
        addTestResult('Sign in successful!');
      }
    } catch (error) {
      addTestResult(`Authentication test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setIsRunningTests(false);
  };

  const runApiTests = async () => {
    setIsRunningTests(true);
    addTestResult('Starting API tests...');

    try {
      // Test 1: Search detections
      addTestResult('Testing search detections...');
      const searchData = await searchDetectionsQuery.refetch();
      if (searchData.data) {
        addTestResult(`Search successful: ${searchData.data.count} detections found`);
      } else {
        addTestResult('Search failed');
      }

      // Test 2: Video details
      addTestResult('Testing video details...');
      const videoData = await videoDetailsQuery.refetch();
      if (videoData.data) {
        addTestResult(`Video details successful: ${videoData.data.fileName}`);
      } else {
        addTestResult('Video details failed');
      }

      // Test 3: Upload video (mock)
      addTestResult('Testing video upload...');
      const uploadResult = await uploadVideoMutation.mutateAsync({
        fileName: TEST_CONFIG.testVideo.fileName,
        fileType: TEST_CONFIG.testVideo.fileType,
      });
      addTestResult(`Upload successful: ${uploadResult.videoId}`);

    } catch (error) {
      addTestResult(`API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    setIsRunningTests(false);
  };

  const runAllTests = async () => {
    clearTestResults();
    await runAuthenticationTests();
    await runApiTests();
    addTestResult('All tests completed!');
  };

  const testSignOut = async () => {
    try {
      await signOut();
      addTestResult('Sign out successful');
      router.replace('/auth');
    } catch (error) {
      addTestResult(`Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Test Suite</Text>
        <Text style={styles.subtitle}>Validate authentication and API integration</Text>

        {/* Test Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Controls</Text>
          
          <TouchableOpacity
            style={styles.testButton}
            onPress={runAllTests}
            disabled={isRunningTests}
          >
            {isRunningTests ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="play" size={20} color="white" />
                <Text style={styles.testButtonText}>Run All Tests</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.testButton, styles.secondaryButton]}
              onPress={runAuthenticationTests}
              disabled={isRunningTests}
            >
              <Text style={styles.secondaryButtonText}>Auth Tests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testButton, styles.secondaryButton]}
              onPress={runApiTests}
              disabled={isRunningTests}
            >
              <Text style={styles.secondaryButtonText}>API Tests</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.testButton, styles.clearButton]}
            onPress={clearTestResults}
          >
            <Text style={styles.clearButtonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        {/* Current Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Ionicons 
                name={isAuthenticated ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={isAuthenticated ? "#34C759" : "#FF3B30"} 
              />
              <Text style={styles.statusText}>
                Authentication: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
              </Text>
            </View>
            
            {user && (
              <View style={styles.statusRow}>
                <Ionicons name="person" size={20} color="#007AFF" />
                <Text style={styles.statusText}>
                  User: {user.givenName} ({user.email})
                </Text>
              </View>
            )}

            <View style={styles.statusRow}>
              <Ionicons 
                name={searchDetectionsQuery.isLoading ? "time" : "checkmark-circle"} 
                size={20} 
                color={searchDetectionsQuery.isLoading ? "#FF9500" : "#34C759"} 
              />
              <Text style={styles.statusText}>
                Search API: {searchDetectionsQuery.isLoading ? 'Loading' : 'Ready'}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <Ionicons 
                name={videoDetailsQuery.isLoading ? "time" : "checkmark-circle"} 
                size={20} 
                color={videoDetailsQuery.isLoading ? "#FF9500" : "#34C759"} 
              />
              <Text style={styles.statusText}>
                Video API: {videoDetailsQuery.isLoading ? 'Loading' : 'Ready'}
              </Text>
            </View>
          </View>
        </View>

        {/* Test Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <View style={styles.resultsContainer}>
            {testResults.length === 0 ? (
              <Text style={styles.noResultsText}>No test results yet. Run tests to see results.</Text>
            ) : (
              testResults.map((result, index) => (
                <View key={index} style={styles.resultItem}>
                  <Text style={styles.resultText}>{result}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity
            style={[styles.testButton, styles.signOutButton]}
            onPress={testSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text style={styles.testButtonText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.secondaryButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
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
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1c1c1e',
  },
  testButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: '#f2f2f7',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#FF9500',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
  },
  statusCard: {
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#1c1c1e',
    marginLeft: 10,
  },
  resultsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noResultsText: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  resultText: {
    fontSize: 12,
    color: '#1c1c1e',
    fontFamily: 'monospace',
  },
});
