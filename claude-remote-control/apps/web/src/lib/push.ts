import webpush from "web-push";

// Configure VAPID details
const VAPID_PUBLIC_KEY = process.env.PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = "mailto:stan@quivr.app";

// Initialize web-push with VAPID keys
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  badge?: string;
  body: string;
  data?: Record<string, unknown>;
  icon?: string;
  tag?: string;
  title: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Send a push notification to a subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    const error = err as { statusCode?: number };
    // 410 Gone or 404 Not Found means subscription is expired
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.warn(
        "[Push] Subscription expired:",
        subscription.endpoint.slice(0, 50)
      );
      return false;
    }
    console.error("[Push] Error sending notification:", err);
    return false;
  }
}
