export interface NotificationPort {
  showNotification(title: string, message: string, actionUrl?: string): void
  requestPermission(): Promise<boolean>
}
