import { getDb, SELECT_CONNECTION } from "@/lib/db";

const LOCAL_USER_ID = "local";

export async function GET() {
  try {
    const connections = getDb()
      .prepare(`${SELECT_CONNECTION} WHERE user_id = ?`)
      .all(LOCAL_USER_ID);

    return Response.json(connections);
  } catch (error) {
    console.error("Error fetching connections:", error);
    return Response.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = crypto.randomUUID();
    const now = Date.now();

    getDb()
      .prepare(
        `INSERT INTO agent_connection (id, user_id, url, name, machine_id, method, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        LOCAL_USER_ID,
        body.url,
        body.name,
        body.machineId ?? null,
        body.method || "tailscale",
        body.color ?? null,
        now,
        now
      );

    const connection = getDb()
      .prepare(`${SELECT_CONNECTION} WHERE id = ?`)
      .get(id);

    return Response.json(connection);
  } catch (error) {
    console.error("Error creating connection:", error);
    return Response.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }
}
