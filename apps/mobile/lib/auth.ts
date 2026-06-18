/**
 * Token persistence helpers backed by expo-secure-store. Tokens are issued by
 * the API (which wraps Supabase Auth) and read back here to authorise requests.
 */
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'vital.access_token';
const REFRESH_KEY = 'vital.refresh_token';

export async function setSession(accessToken: string, refreshToken?: string) {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
  if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getAccessToken()) !== null;
}
