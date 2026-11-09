import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytesAsync } from 'expo-crypto';
import { createAuthService, type AccountStorage } from './auth';
export const localStorageAdapter: AccountStorage = {
  async get(key) { return Platform.OS === 'web' ? globalThis.localStorage.getItem(key) : SecureStore.getItemAsync(key); },
  async set(key, value) { if (Platform.OS === 'web') globalThis.localStorage.setItem(key, value); else await SecureStore.setItemAsync(key, value); },
  async remove(key) { if (Platform.OS === 'web') globalThis.localStorage.removeItem(key); else await SecureStore.deleteItemAsync(key); },
};
export const authService = createAuthService(localStorageAdapter, getRandomBytesAsync);
