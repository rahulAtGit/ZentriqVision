import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../hooks/useAuthStore";
import { Ionicons } from "@expo/vector-icons";

export default function AuthScreen() {
  const router = useRouter();
  const {
    signIn,
    signUp,
    confirmSignUp,
    forgotPassword,
    confirmForgotPassword,
    resendConfirmationCode,
    isLoading,
    error,
    clearError,
  } = useAuthStore();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isConfirmingForgotPassword, setIsConfirmingForgotPassword] =
    useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [givenName, setGivenName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Debug state changes
  useEffect(() => {
    console.log("Auth state changed:", {
      isSignUp,
      isConfirming,
      isForgotPassword,
      isConfirmingForgotPassword,
      pendingEmail,
    });
  }, [
    isSignUp,
    isConfirming,
    isForgotPassword,
    isConfirmingForgotPassword,
    pendingEmail,
  ]);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      await signIn({ email, password });
      router.replace("/");
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !givenName) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    try {
      console.log("Starting sign up process...");
      await signUp({ email, password, givenName, phoneNumber });
      console.log("Sign up successful, setting confirmation state...");

      // Set the confirmation state first
      setPendingEmail(email);
      setIsConfirming(true);

      console.log("Confirmation state set:", { email, isConfirming: true });

      // Then show the alert
      Alert.alert(
        "Success",
        "Account created! Please check your email for a confirmation code.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Sign up error:", error);
      // Error is handled by the store
    }
  };

  const handleConfirmSignUp = async () => {
    if (!confirmationCode) {
      Alert.alert("Error", "Please enter the confirmation code");
      return;
    }

    try {
      await confirmSignUp(pendingEmail, confirmationCode);
      Alert.alert("Success", "Account confirmed! You can now sign in.", [
        {
          text: "OK",
          onPress: () => {
            setIsConfirming(false);
            setIsSignUp(false);
            clearForm();
          },
        },
      ]);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      await forgotPassword(email);
      setPendingEmail(email);
      setIsConfirmingForgotPassword(true);
      Alert.alert(
        "Success",
        "Password reset code sent! Please check your email.",
        [{ text: "OK" }]
      );
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleConfirmForgotPassword = async () => {
    if (!confirmationCode || !newPassword) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters long");
      return;
    }

    try {
      await confirmForgotPassword(pendingEmail, confirmationCode, newPassword);
      Alert.alert(
        "Success",
        "Password reset successfully! You can now sign in with your new password.",
        [
          {
            text: "OK",
            onPress: () => {
              setIsConfirmingForgotPassword(false);
              setIsForgotPassword(false);
              clearForm();
            },
          },
        ]
      );
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleResendCode = async () => {
    try {
      await resendConfirmationCode(pendingEmail);
      Alert.alert("Success", "Confirmation code resent to your email");
    } catch (error) {
      // Error is handled by the store
    }
  };

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setGivenName("");
    setPhoneNumber("");
    setConfirmationCode("");
    setPendingEmail("");
    setNewPassword("");
    clearError();
  };

  const goBackToSignIn = () => {
    setIsConfirming(false);
    setIsForgotPassword(false);
    setIsConfirmingForgotPassword(false);
    setIsSignUp(false);
    clearForm();
  };

  // Password reset confirmation screen
  if (isConfirmingForgotPassword) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="videocam" size={64} color="#007AFF" />
            </View>
            <Text style={styles.appName}>ZentriqVision</Text>
            <Text style={styles.appTagline}>AI-Powered Video Surveillance</Text>
          </View>

          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Please enter the reset code sent to {pendingEmail}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#8e8e93" />
              <TextInput
                style={styles.input}
                placeholder="Reset Code"
                value={confirmationCode}
                onChangeText={setConfirmationCode}
                keyboardType="number-pad"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#8e8e93" />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoComplete="password-new"
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleConfirmForgotPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={goBackToSignIn}
            >
              <Text style={styles.linkText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Email confirmation screen
  if (isConfirming) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="videocam" size={64} color="#007AFF" />
            </View>
            <Text style={styles.appName}>ZentriqVision</Text>
            <Text style={styles.appTagline}>AI-Powered Video Surveillance</Text>
          </View>

          <Text style={styles.title}>Confirm Account</Text>
          <Text style={styles.subtitle}>
            Please enter the confirmation code sent to {pendingEmail}
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#8e8e93" />
              <TextInput
                style={styles.input}
                placeholder="Confirmation Code"
                value={confirmationCode}
                onChangeText={setConfirmationCode}
                keyboardType="number-pad"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleConfirmSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Confirm Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleResendCode}
            >
              <Text style={styles.linkText}>Resend Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={goBackToSignIn}
            >
              <Text style={styles.linkText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Forgot password screen
  if (isForgotPassword) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="videocam" size={64} color="#007AFF" />
            </View>
            <Text style={styles.appName}>ZentriqVision</Text>
            <Text style={styles.appTagline}>AI-Powered Video Surveillance</Text>
          </View>

          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email to receive a password reset code
          </Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#8e8e93" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={goBackToSignIn}
            >
              <Text style={styles.linkText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="videocam" size={64} color="#007AFF" />
          </View>
          <Text style={styles.appName}>ZentriqVision</Text>
          <Text style={styles.appTagline}>AI-Powered Video Surveillance</Text>
        </View>

        <Text style={styles.title}>
          {isSignUp ? "Create Account" : "Welcome Back"}
        </Text>
        <Text style={styles.subtitle}>
          {isSignUp
            ? "Sign up to start using ZentriqVision"
            : "Sign in to your account"}
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          {isSignUp && (
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#8e8e93" />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={givenName}
                onChangeText={setGivenName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#8e8e93" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#8e8e93" />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (Optional)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#8e8e93" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={isSignUp ? handleSignUp : handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? "Create Account" : "Sign In"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              clearForm();
            }}
          >
            <Text style={styles.linkText}>
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>

          {!isSignUp && (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setIsForgotPassword(true)}
            >
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1c1c1e",
    textAlign: "center",
    marginBottom: 5,
  },
  appTagline: {
    fontSize: 16,
    color: "#8e8e93",
    textAlign: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1c1c1e",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#8e8e93",
    textAlign: "center",
    marginBottom: 30,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: "#FF3B30",
    marginLeft: 10,
    flex: 1,
  },
  form: {
    gap: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#1c1c1e",
  },
  button: {
    backgroundColor: "#007AFF",
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
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  linkText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
});
