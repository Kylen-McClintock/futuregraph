import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/auth-session";
import { linkOracle } from "@/lib/oracle-sync";
import type { OracleProvider } from "@/types/futuregraph";

/** Link (or unlink) a Polymarket / Metaculus market as this question's resolution oracle. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Editor or admin access required." }, { status: 403 });
  }
  try {
    const body = await request.json();
    const provider = String(body.provider || "editorial") as OracleProvider;
    if (!["editorial", "polymarket", "metaculus"].includes(provider)) {
      return NextResponse.json({ error: "Unknown oracle provider." }, { status: 400 });
    }
    const node = linkOracle({
      nodeId: params.id,
      provider,
      externalId: body.externalId,
      outcomeLabel: body.outcomeLabel,
      url: body.url,
    });
    return NextResponse.json({ nodeId: node.id, question: node.question });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not link oracle" }, { status: 400 });
  }
}
