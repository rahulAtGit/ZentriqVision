import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../hooks/useAuthStore";
import { Ionicons } from "@expo/vector-icons";

export default function IndexScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut } = useAuthStore();

  useEffect(() => {
    // If not authenticated and not loading, redirect to auth
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If not authenticated, show loading (will redirect to auth)
  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Redirecting to login...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="videocam" size={48} color="#007AFF" />
          <Text style={styles.title}>
            Welcome, {user?.givenName || "User"}!
          </Text>
          <Text style={styles.subtitle}>Video Surveillance AI Dashboard</Text>
        </View>

        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <Ionicons name="person-circle" size={40} color="#007AFF" />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.givenName || "User"}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.userOrg}>Organization: {user?.orgId}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/upload")}
            >
              <Ionicons name="cloud-upload" size={32} color="#007AFF" />
              <Text style={styles.actionTitle}>Upload Video</Text>
              <Text style={styles.actionSubtitle}>
                Upload surveillance video
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/library")}
            >
              <Ionicons name="library" size={32} color="#007AFF" />
              <Text style={styles.actionTitle}>Video Library</Text>
              <Text style={styles.actionSubtitle}>Browse your videos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/search")}
            >
              <Ionicons name="search" size={32} color="#007AFF" />
              <Text style={styles.actionTitle}>Search Detections</Text>
              <Text style={styles.actionSubtitle}>
                Search for people and objects
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/profile")}
            >
              <Ionicons name="person-circle" size={32} color="#007AFF" />
              <Text style={styles.actionTitle}>Profile</Text>
              <Text style={styles.actionSubtitle}>Manage your account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Development Tools */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Development Tools</Text>
            <TouchableOpacity
              style={styles.devCard}
              onPress={() => router.push("/test")}
            >
              <Ionicons name="flask" size={32} color="#FF9500" />
              <Text style={styles.devCardTitle}>Test Suite</Text>
              <Text style={styles.devCardSubtitle}>
                Test authentication and API integration
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <Ionicons name="time-outline" size={20} color="#8e8e93" />
              <Text style={styles.activityText}>No recent activity</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="videocam-outline" size={24} color="#007AFF" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={24} color="#007AFF" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Detections</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="analytics-outline" size={24} color="#007AFF" />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Analytics</Text>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    fontSize: 16,
    color: "#8e8e93",
    marginTop: 15,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1c1c1e",
    marginTop: 15,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#8e8e93",
  },
  userCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userDetails: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1c1c1e",
  },
  userEmail: {
    fontSize: 14,
    color: "#8e8e93",
    marginTop: 2,
  },
  userOrg: {
    fontSize: 14,
    color: "#8e8e93",
    marginTop: 2,
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
  actionGrid: {
    flexDirection: "row",
    gap: 15,
  },
  actionCard: {
    flex: 1,
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
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1c1c1e",
    marginTop: 10,
    marginBottom: 5,
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#8e8e93",
    textAlign: "center",
  },
  devCard: {
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
  devCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1c1c1e",
    marginTop: 10,
    marginBottom: 5,
  },
  devCardSubtitle: {
    fontSize: 12,
    color: "#8e8e93",
    textAlign: "center",
  },
  activityCard: {
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
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityText: {
    fontSize: 14,
    color: "#8e8e93",
    marginLeft: 10,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 15,
  },
  statCard: {
    flex: 1,
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
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#8e8e93",
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE5E5",
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
  },
  signOutText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
