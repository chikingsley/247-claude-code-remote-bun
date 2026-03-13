/**
 * GET /api/push/vapid-key
 * Get the VAPID public key for push subscription
 */
export async function GET() {
  const publicKey = process.env.PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return Response.json(
      { error: "VAPID key not configured" },
      { status: 500 }
    );
  }

  return Response.json({ publicKey });
}
