/**
 * Client-side push registration. Asks the OS for notification permission,
 * fetches this device's Expo push token, and hands it to the backend (POST
 * /devices) so the server can deliver pushes — booking updates, the doctor's
 * "on the way" alerts, out-of-range results, etc.
 *
 * Best-effort: every failure is swallowed so push setup can never block the app.
 * Note: remote push banners only arrive in a real dev/production build — Expo Go
 * cannot receive them, so in Expo Go this registers a token but no banner shows.
 */
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { notificationApi } from './api';

// Show a banner (and play a sound) when a push arrives while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registered = false;

function osPlatform(): 'ios' | 'android' | 'web' {
  return Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
}

/**
 * Register this device for push. Safe to call repeatedly — it no-ops once a
 * token has been sent for the current session. Call after authentication so the
 * token is attached to the signed-in user.
 */
export async function registerForPushNotifications(): Promise<void> {
  if (registered) return;
  try {
    // Android requires a channel for heads-up banners.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    // Ask for permission only if we don't already have it.
    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;
    if (!granted && existing.canAskAgain) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.granted;
    }
    if (!granted) return;

    // projectId is needed to mint an Expo push token in a real build.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    if (!token) return;

    await notificationApi.registerDevice(token, osPlatform());
    registered = true;
  } catch {
    // Push is non-critical; never surface registration errors to the user.
  }
}

/** Allow re-registration after a sign-out so the next user claims this device. */
export function resetPushRegistration(): void {
  registered = false;
}
