import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { useApi } from '../hooks/useApi';
import { Ionicons } from '@expo/vector-icons';
import { SearchFilters, PersonDetection } from '../types';

export default function SearchScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { useSearchDetections } = useApi();
  
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Use the API hook for search
  const {
    data: searchData,
    isLoading,
    error,
    refetch
  } = useSearchDetections(filters, 50);

  const results = searchData?.results || [];

  const searchDetections = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to search');
      return;
    }

    try {
      await refetch();
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Error', 'Search failed. Please try again.');
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const navigateToPlayback = (videoId: string) => {
    router.push(`/playback/${videoId}`);
  };

  // Auto-search when filters change
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      searchDetections();
    }
  }, [filters]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Failed to load search results</Text>
        <TouchableOpacity style={styles.retryButton} onPress={searchDetections}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Search Detections</Text>
        
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8e8e93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for people, objects, colors..."
            placeholderTextColor="#8e8e93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersTitle}>Filters</Text>
            
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Color:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['red', 'blue', 'green', 'black', 'white'].map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.filterChip,
                      filters.color === color && styles.filterChipActive
                    ]}
                    onPress={() => updateFilter('color', filters.color === color ? undefined : color)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.color === color && styles.filterChipTextActive
                    ]}>
                      {color}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Emotion:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['happy', 'sad', 'neutral', 'angry'].map(emotion => (
                  <TouchableOpacity
                    key={emotion}
                    style={[
                      styles.filterChip,
                      filters.emotion === emotion && styles.filterChipActive
                    ]}
                    onPress={() => updateFilter('emotion', filters.emotion === emotion ? undefined : emotion)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.emotion === emotion && styles.filterChipTextActive
                    ]}>
                      {emotion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Age:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['0-17', '18-24', '25-34', '35-49', '50+'].map(age => (
                  <TouchableOpacity
                    key={age}
                    style={[
                      styles.filterChip,
                      filters.ageBucket === age && styles.filterChipActive
                    ]}
                    onPress={() => updateFilter('ageBucket', filters.ageBucket === age ? undefined : age)}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.ageBucket === age && styles.filterChipTextActive
                    ]}>
                      {age}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Button */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={searchDetections}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="white" />
              <Text style={styles.searchButtonText}>Search</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Results */}
        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              {results.length} detection{results.length !== 1 ? 's' : ''} found
            </Text>
            
            {results.map((detection: PersonDetection, index: number) => (
              <TouchableOpacity
                key={`${detection.personId}-${index}`}
                style={styles.resultCard}
                onPress={() => navigateToPlayback(detection.videoId)}
              >
                <View style={styles.resultHeader}>
                  <Ionicons name="person" size={24} color="#007AFF" />
                  <Text style={styles.resultTitle}>Person {detection.personId}</Text>
                  <Text style={styles.resultConfidence}>
                    {(detection.confidence * 100).toFixed(0)}% confidence
                  </Text>
                </View>
                
                <View style={styles.resultDetails}>
                  <Text style={styles.resultDetail}>
                    Age: {detection.attributes.ageBucket || 'Unknown'}
                  </Text>
                  <Text style={styles.resultDetail}>
                    Gender: {detection.attributes.gender || 'Unknown'}
                  </Text>
                  <Text style={styles.resultDetail}>
                    Emotion: {detection.attributes.emotion || 'Unknown'}
                  </Text>
                  {detection.attributes.upperColor && (
                    <Text style={styles.resultDetail}>
                      Upper: {detection.attributes.upperColor}
                    </Text>
                  )}
                </View>
                
                <Text style={styles.resultTimestamp}>
                  {new Date(detection.timestamp).toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* No Results */}
        {!isLoading && results.length === 0 && Object.keys(filters).length > 0 && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="#8e8e93" />
            <Text style={styles.noResultsText}>No detections found</Text>
            <Text style={styles.noResultsSubtext}>
              Try adjusting your filters or search criteria
            </Text>
          </View>
        )}
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
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterButton: {
    padding: 5,
  },
  filtersContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1c1c1e',
  },
  filterRow: {
    marginBottom: 15,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#1c1c1e',
  },
  filterChip: {
    backgroundColor: '#f2f2f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    color: '#8e8e93',
    fontSize: 14,
  },
  filterChipTextActive: {
    color: 'white',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  clearFiltersText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1c1c1e',
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginLeft: 8,
    flex: 1,
  },
  resultConfidence: {
    fontSize: 14,
    color: '#8e8e93',
  },
  resultDetails: {
    marginBottom: 8,
  },
  resultDetail: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 2,
  },
  resultTimestamp: {
    fontSize: 12,
    color: '#8e8e93',
    fontStyle: 'italic',
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#8e8e93',
    marginTop: 15,
    marginBottom: 5,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#8e8e93',
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
