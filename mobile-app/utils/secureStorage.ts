import * as SecureStore from 'expo-secure-store';

// Secure storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'zentriqvision_access_token',
  REFRESH_TOKEN: 'zentriqvision_refresh_token',
  USER_DATA: 'zentriqvision_user_data',
  AUTH_STATE: 'zentriqvision_auth_state',
} as const;

class SecureStorage {
  /**
   * Store a value securely
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('Failed to store item securely:', error);
      throw error;
    }
  }

  /**
   * Retrieve a value securely
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Failed to retrieve item securely:', error);
      return null;
    }
  }

  /**
   * Delete a value securely
   */
  static async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Failed to delete item securely:', error);
      throw error;
    }
  }

  /**
   * Store access token
   */
  static async setAccessToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  /**
   * Get access token
   */
  static async getAccessToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Store refresh token
   */
  static async setRefreshToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  /**
   * Get refresh token
   */
  static async getRefreshToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Store user data
   */
  static async setUserData(userData: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.USER_DATA, userData);
  }

  /**
   * Get user data
   */
  static async getUserData(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Store auth state
   */
  static async setAuthState(authState: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.AUTH_STATE, authState);
  }

  /**
   * Get auth state
   */
  static async getAuthState(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.AUTH_STATE);
  }

  /**
   * Clear all authentication data
   */
  static async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        this.deleteItem(STORAGE_KEYS.ACCESS_TOKEN),
        this.deleteItem(STORAGE_KEYS.REFRESH_TOKEN),
        this.deleteItem(STORAGE_KEYS.USER_DATA),
        this.deleteItem(STORAGE_KEYS.AUTH_STATE),
      ]);
    } catch (error) {
      console.error('Failed to clear auth data:', error);
      throw error;
    }
  }

  /**
   * Check if secure storage is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const testKey = 'test_key';
      const testValue = 'test_value';
      await this.setItem(testKey, testValue);
      const retrieved = await this.getItem(testKey);
      await this.deleteItem(testKey);
      return retrieved === testValue;
    } catch (error) {
      console.error('Secure storage not available:', error);
      return false;
    }
  }
}

export default SecureStorage;
export { STORAGE_KEYS };
