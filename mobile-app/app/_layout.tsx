import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initializeAmplify } from "../config/amplify";
import { useEffect } from "react";

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
  useEffect(() => {
    // Initialize Amplify only once when app starts
    initializeAmplify();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#007AFF",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "ZentriqVision",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            title: "Authentication",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="upload"
          options={{
            title: "Upload Video",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="library"
          options={{
            title: "Video Library",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            title: "Search Detections",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="playback/[videoId]"
          options={{
            title: "Video Playback",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="test"
          options={{
            title: "Test Suite",
            headerShown: true,
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
