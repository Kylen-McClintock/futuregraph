import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const evidence = store.nodeSources.filter((ns) => ns.nodeId === params.id);
  return NextResponse.json({ nodeId: params.id, evidence });
}
