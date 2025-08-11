import { Stack } from "expo-router";

export default function RootLayout() {
  return (
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
  );
}
