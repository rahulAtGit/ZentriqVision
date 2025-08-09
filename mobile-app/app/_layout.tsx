import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize authentication state
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'ZentriqVision',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="auth" 
          options={{ 
            title: 'Authentication',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="upload" 
          options={{ 
            title: 'Upload Video',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="search" 
          options={{ 
            title: 'Search',
            headerShown: true 
          }} 
        />
        <Stack.Screen 
          name="playback/[videoId]" 
          options={{ 
            title: 'Video Playback',
            headerShown: true 
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
