import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const argumentsList = store.arguments.filter((a) => a.nodeId === params.id);
  const comments = store.comments.filter((c) => c.nodeId === params.id);
  return NextResponse.json({
    nodeId: params.id,
    arguments: argumentsList,
    comments,
  });
}
