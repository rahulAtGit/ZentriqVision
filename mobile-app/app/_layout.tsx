import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../hooks/useAuthStore';
import { initializeAmplify } from '../config/amplify';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const { initializeAuth, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // Initialize Amplify
    initializeAmplify();
    
    // Initialize authentication
    initializeAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'ZentriqVision',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            title: 'Authentication',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="upload"
          options={{
            title: 'Upload Video',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            title: 'Search Detections',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="playback/[videoId]"
          options={{
            title: 'Video Playback',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="test"
          options={{
            title: 'Test Suite',
            headerShown: true,
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
