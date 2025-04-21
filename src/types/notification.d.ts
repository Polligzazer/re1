interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface ExtendedNotificationOptions extends NotificationOptions {
  vibrate?: number[];
  badge?: string;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
}

declare global {
  interface Window {
    Notification: {
      prototype: Notification;
      new(title: string, options?: ExtendedNotificationOptions): Notification;
      readonly maxActions: number;
      permission: NotificationPermission;
      requestPermission(deprecatedCallback?: NotificationPermissionCallback): Promise<NotificationPermission>;
    };
  }
}