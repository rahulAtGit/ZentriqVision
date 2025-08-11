import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../hooks/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoUploadEnabled, setAutoUploadEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await signOut();
              router.replace('/auth');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert('Coming Soon', 'Password change functionality will be available soon');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Coming Soon', 'Account deletion will be available soon');
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert('Contact Support', 'Email: support@zentriqvision.com\nPhone: +1-800-ZENTRIQ');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy details will be displayed here');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'Terms of service details will be displayed here');
  };

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>User information not available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#007AFF" />
          </View>
          <Text style={styles.userName}>{user.givenName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userOrg}>Organization: {user.orgId}</Text>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#8e8e93" />
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user.givenName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#8e8e93" />
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color="#8e8e93" />
              <Text style={styles.infoLabel}>Organization</Text>
              <Text style={styles.infoValue}>{user.orgId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />
              <Text style={styles.infoLabel}>Email Verified</Text>
              <Text style={styles.infoValue}>
                {user.isEmailVerified ? 'Yes' : 'No'}
              </Text>
            </View>
            {user.phoneNumber && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#8e8e93" />
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{user.phoneNumber}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.preferencesCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Ionicons name="notifications-outline" size={20} color="#8e8e93" />
                <Text style={styles.preferenceLabel}>Push Notifications</Text>
                <Text style={styles.preferenceDescription}>
                  Receive alerts for video processing and detections
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#f2f2f7', true: '#007AFF' }}
                thumbColor={notificationsEnabled ? '#ffffff' : '#ffffff'}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Ionicons name="cloud-upload-outline" size={20} color="#8e8e93" />
                <Text style={styles.preferenceLabel}>Auto-Upload</Text>
                <Text style={styles.preferenceDescription}>
                  Automatically upload videos from camera roll
                </Text>
              </View>
              <Switch
                value={autoUploadEnabled}
                onValueChange={setAutoUploadEnabled}
                trackColor={{ false: '#f2f2f7', true: '#007AFF' }}
                thumbColor={autoUploadEnabled ? '#ffffff' : '#ffffff'}
              />
            </View>

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Ionicons name="moon-outline" size={20} color="#8e8e93" />
                <Text style={styles.preferenceLabel}>Dark Mode</Text>
                <Text style={styles.preferenceDescription}>
                  Use dark theme for better viewing in low light
                </Text>
              </View>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#f2f2f7', true: '#007AFF' }}
                thumbColor={darkModeEnabled ? '#ffffff' : '#ffffff'}
              />
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionRow} onPress={handleChangePassword}>
              <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
              <Text style={styles.actionLabel}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handleContactSupport}>
              <Ionicons name="help-circle-outline" size={20} color="#007AFF" />
              <Text style={styles.actionLabel}>Contact Support</Text>
              <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handlePrivacyPolicy}>
              <Ionicons name="shield-outline" size={20} color="#007AFF" />
              <Text style={styles.actionLabel}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow} onPress={handleTermsOfService}>
              <Ionicons name="document-text-outline" size={20} color="#007AFF" />
              <Text style={styles.actionLabel}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={styles.dangerLabel}>Delete Account</Text>
              <Ionicons name="chevron-forward" size={20} color="#8e8e93" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>ZentriqVision v1.0.0</Text>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 5,
  },
  userOrg: {
    fontSize: 14,
    color: '#8e8e93',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  infoLabel: {
    fontSize: 16,
    color: '#1c1c1e',
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#8e8e93',
    fontWeight: '500',
  },
  preferencesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 15,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 18,
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  actionLabel: {
    fontSize: 16,
    color: '#1c1c1e',
    marginLeft: 10,
    flex: 1,
  },
  dangerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  dangerLabel: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 10,
    flex: 1,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#8e8e93',
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
  },
});
