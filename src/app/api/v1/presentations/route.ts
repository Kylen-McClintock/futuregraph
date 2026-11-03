import { NextRequest, NextResponse } from "next/server";
import { createPresentationDeck, getStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  return NextResponse.json({ presentations: store.presentations });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const presentation = await createPresentationDeck({
      title: body.title || "Custom AI 2027 Story Deck",
      subtitle: body.subtitle,
      authorHandle: body.authorHandle || "elena_vance",
      aspectRatio: body.aspectRatio || "16:9",
      scenes: Array.isArray(body.scenes) ? body.scenes : [],
    });
    return NextResponse.json({ presentation }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create presentation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
