import { getDb, SELECT_CONNECTION } from "@/lib/db";

const LOCAL_USER_ID = "local";

export async function DELETE(
  req: Request & { params: Record<string, string> }
) {
  try {
    const id = req.params.id;

    getDb()
      .prepare("DELETE FROM agent_connection WHERE id = ? AND user_id = ?")
      .run(id, LOCAL_USER_ID);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting connection:", error);
    return Response.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request & { params: Record<string, string> }) {
  try {
    const id = req.params.id;
    const body = await req.json();
    const now = Date.now();

    getDb()
      .prepare(
        `UPDATE agent_connection SET name = ?, url = ?, method = ?, color = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`
      )
      .run(
        body.name,
        body.url,
        body.method,
        body.color ?? null,
        now,
        id,
        LOCAL_USER_ID
      );

    const connection = getDb()
      .prepare(`${SELECT_CONNECTION} WHERE id = ? AND user_id = ?`)
      .get(id, LOCAL_USER_ID);

    if (!connection) {
      return Response.json({ error: "Connection not found" }, { status: 404 });
    }

    return Response.json(connection);
  } catch (error) {
    console.error("Error updating connection:", error);
    return Response.json(
      { error: "Failed to update connection" },
      { status: 500 }
    );
  }
}
