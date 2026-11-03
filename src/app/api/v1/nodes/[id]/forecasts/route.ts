import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const forecasts = store.forecastEvents.filter((f) => f.nodeId === params.id);
  return NextResponse.json({ nodeId: params.id, forecasts });
}
