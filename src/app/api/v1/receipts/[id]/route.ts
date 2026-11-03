import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { verifyAuditReceipt } from "@/lib/audit-receipt";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const store = getStore();
  const receipt = store.auditReceipts.find(
    (r) => r.eventId === params.id || r.entityId === params.id
  );
  if (!receipt) {
    return NextResponse.json(
      { error: `Receipt '${params.id}' not found` },
      { status: 404 }
    );
  }

  const verification = verifyAuditReceipt(receipt);
  return NextResponse.json({
    receipt,
    verification,
  });
}
