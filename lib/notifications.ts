export type NotificationPriority = 1 | 2 | 3 | 4 | 5

export type NotificationType =
  | "payment_success"
  | "payment_failed"
  | "security_alert"
  | "account"
  | "new_song_release"
  | "new_album_release"
  | "new_follower"
  | "song_liked"
  | "artist_pro_feature_used"
  | "admin_alert"

export interface AppNotification {
  id: string
  user_notification_id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  deep_link: string | null
  metadata: Record<string, unknown> | null
  is_read: boolean
  created_at: string
  read_at: string | null
}

export const PRIORITY_ORDER: Record<NotificationType, NotificationPriority> = {
  payment_success: 1,
  security_alert: 2,
  payment_failed: 3,
  account: 4,
  new_song_release: 5,
  new_album_release: 5,
  new_follower: 5,
  song_liked: 5,
  artist_pro_feature_used: 5,
  admin_alert: 2,
}
