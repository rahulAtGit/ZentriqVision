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
    // Add a small delay to ensure layout is mounted
    const timer = setTimeout(() => {
      if (!isLoading && !isAuthenticated) {
        router.replace("/auth");
      }
    }, 100);

    return () => clearTimeout(timer);
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
          <View style={styles.headerIconContainer}>
            <Ionicons name="videocam" size={48} color="#007AFF" />
          </View>
          <Text style={styles.title}>
            Welcome, {user?.givenName || "User"}!
          </Text>
          <Text style={styles.subtitle}>
            AI-Powered Video Surveillance Dashboard
          </Text>
          <Text style={styles.headerSubtitle}>Monitor • Analyze • Secure</Text>
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
              style={[styles.actionCard, styles.uploadCard]}
              onPress={() => router.push("/upload")}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="cloud-upload" size={32} color="#007AFF" />
              </View>
              <Text style={styles.actionTitle}>Upload Video</Text>
              <Text style={styles.actionSubtitle}>
                Upload surveillance video
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.libraryCard]}
              onPress={() => router.push("/library")}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="library" size={32} color="#34C759" />
              </View>
              <Text style={styles.actionTitle}>Video Library</Text>
              <Text style={styles.actionSubtitle}>Browse your videos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.searchCard]}
              onPress={() => router.push("/search")}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="search" size={32} color="#FF9500" />
              </View>
              <Text style={styles.actionTitle}>Search Detections</Text>
              <Text style={styles.actionSubtitle}>
                Search for people and objects
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.profileCard]}
              onPress={() => router.push("/profile")}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="person-circle" size={32} color="#AF52DE" />
              </View>
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
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
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
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
    letterSpacing: 0.5,
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
    flexWrap: "wrap",
    gap: 15,
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
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
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#F8F9FA",
  },
  uploadCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  libraryCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#34C759",
  },
  searchCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
  },
  profileCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#AF52DE",
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
    flexWrap: "wrap",
    gap: 15,
    justifyContent: "space-between",
  },
  statCard: {
    width: "30%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
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
