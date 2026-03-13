import { getDb } from "@/lib/db";

const LOCAL_USER_ID = "local";

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, userAgent } = body;

    if (
      !(
        subscription?.endpoint &&
        subscription?.keys?.p256dh &&
        subscription?.keys?.auth
      )
    ) {
      return Response.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    const ua = userAgent || req.headers.get("user-agent");

    // Upsert: insert or update on endpoint conflict
    getDb()
      .prepare(
        `INSERT INTO push_subscription (id, user_id, endpoint, p256dh, auth, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(endpoint) DO UPDATE SET
           user_id = excluded.user_id,
           p256dh = excluded.p256dh,
           auth = excluded.auth,
           user_agent = excluded.user_agent`
      )
      .run(
        id,
        LOCAL_USER_ID,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth,
        ua,
        now
      );

    // Get the inserted/updated record's id
    const result = getDb()
      .prepare("SELECT id FROM push_subscription WHERE endpoint = ?")
      .get(subscription.endpoint) as { id: string } | undefined;

    return Response.json({ success: true, id: result?.id ?? id });
  } catch (error) {
    console.error("[Push] Error subscribing:", error);
    return Response.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

/**
 * DELETE /api/push/subscribe
 * Unsubscribe from push notifications
 */
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return Response.json({ error: "Endpoint required" }, { status: 400 });
    }

    getDb()
      .prepare("DELETE FROM push_subscription WHERE endpoint = ?")
      .run(endpoint);

    return Response.json({ success: true });
  } catch (error) {
    console.error("[Push] Error unsubscribing:", error);
    return Response.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
