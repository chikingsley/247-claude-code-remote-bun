import type { DbAgentConnection, DbPushSubscription } from "@/lib/db";
import { getDb } from "@/lib/db";
import { sendPushNotification } from "@/lib/push";

/**
 * POST /api/push/notify
 * Send push notification to user (called by agent with machineId)
 *
 * Body:
 * - machineId: string (agent's machine UUID)
 * - sessionName: string (e.g., "project--session-name")
 * - reason?: string (optional: 'permission', 'input', 'plan_approval', 'task_complete')
 */
// Reason-specific messages for notification body
const reasonMessages: Record<string, string> = {
  permission: "Permission requise",
  input: "Réponse attendue",
  plan_approval: "Approbation du plan",
  task_complete: "Tâche terminée",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { machineId, sessionName, reason } = body;

    if (!machineId) {
      return Response.json({ error: "machineId required" }, { status: 400 });
    }

    if (!sessionName) {
      return Response.json({ error: "sessionName required" }, { status: 400 });
    }

    // Find the agent connection by machineId to get the userId
    const connection = getDb()
      .prepare("SELECT * FROM agent_connection WHERE machine_id = ? LIMIT 1")
      .get(machineId) as DbAgentConnection | undefined;

    console.warn(
      `[Push] Looking for machineId=${machineId}, found connection:`,
      connection?.id || "none"
    );

    if (!connection) {
      // No connection found for this machineId - agent not paired
      console.warn(`[Push] No connection found for machineId=${machineId}`);
      return Response.json({
        success: true,
        sent: 0,
        message: "Agent not paired",
      });
    }

    // Get all push subscriptions for this user
    const subscriptions = getDb()
      .prepare("SELECT * FROM push_subscription WHERE user_id = ?")
      .all(connection.user_id) as DbPushSubscription[];

    console.warn(
      `[Push] Found ${subscriptions.length} subscriptions for userId=${connection.user_id}`
    );

    if (subscriptions.length === 0) {
      return Response.json({
        success: true,
        sent: 0,
        message: "No subscriptions",
      });
    }

    // Extract project name from session name (format: project--session-id)
    const [projectName] = sessionName.split("--");

    // Send push notification to all user's subscriptions
    // Use connection.id (not machineId) because that's what the web app uses as machine identifier
    const notificationUrl = `/?machine=${encodeURIComponent(connection.id)}&session=${encodeURIComponent(sessionName)}`;

    const payload = {
      title: `Claude - ${projectName}`,
      body: reasonMessages[reason] || "Attention requise",
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      tag: `claude-${sessionName}`,
      data: {
        sessionName,
        projectName,
        connectionId: connection.id,
        url: notificationUrl,
      },
    };

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const success = await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        );

        // Remove expired subscription
        if (!success) {
          getDb()
            .prepare("DELETE FROM push_subscription WHERE id = ?")
            .run(sub.id);
        }

        return success;
      })
    );

    const sent = results.filter(
      (r) => r.status === "fulfilled" && r.value === true
    ).length;
    const expired = results.filter(
      (r) => r.status === "fulfilled" && r.value === false
    ).length;

    console.warn(
      `[Push] Sent ${sent} notifications for ${sessionName} (${expired} expired)`
    );

    return Response.json({ success: true, sent, expired });
  } catch (error) {
    console.error("[Push] Error sending notification:", error);
    return Response.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
