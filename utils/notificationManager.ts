
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationManager = {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('leftover-expiry', {
          name: 'Leftover Expiry Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.log('Error requesting notification permissions:', error);
      return false;
    }
  },

  async scheduleExpiryNotification(
    leftoverId: string,
    leftoverName: string,
    expiryDate: Date
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Cannot schedule notification without permissions');
        return null;
      }

      // Calculate seconds until expiry
      const now = new Date();
      const secondsUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / 1000);

      // Don't schedule if already expired
      if (secondsUntilExpiry <= 0) {
        console.log('Leftover already expired, not scheduling notification');
        return null;
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍽️ Leftover Expired!',
          body: `"${leftoverName}" has expired. Time to toss it out!`,
          data: { leftoverId, leftoverName },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilExpiry,
          channelId: Platform.OS === 'android' ? 'leftover-expiry' : undefined,
        },
      });

      console.log(`Scheduled notification for "${leftoverName}" in ${secondsUntilExpiry} seconds (ID: ${identifier})`);
      return identifier;
    } catch (error) {
      console.log('Error scheduling notification:', error);
      return null;
    }
  },

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Cancelled notification: ${notificationId}`);
    } catch (error) {
      console.log('Error cancelling notification:', error);
    }
  },

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all notifications');
    } catch (error) {
      console.log('Error cancelling all notifications:', error);
    }
  },

  async getAllScheduledNotifications(): Promise<Notifications.Notification[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.log('Error getting scheduled notifications:', error);
      return [];
    }
  },
};
