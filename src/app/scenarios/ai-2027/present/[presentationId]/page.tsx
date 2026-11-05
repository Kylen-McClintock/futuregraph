"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  BranchingTreePresenter,
  PresentTreeKey,
} from "@/components/BranchingTreePresenter";

function PresentModeInner({ presentationId }: { presentationId: string }) {
  const searchParams = useSearchParams();
  const treeParam = searchParams.get("tree");
  const nodeParam = searchParams.get("node");

  let initialTreeKey: PresentTreeKey = "ai-2050-simple";
  if (
    treeParam === "ai-2050-simple" ||
    treeParam === "ai-2050-comprehensive" ||
    treeParam === "ai-2027" ||
    treeParam === "ai-2040"
  ) {
    initialTreeKey = treeParam;
  } else if (presentationId?.includes("2040")) {
    initialTreeKey = "ai-2040";
  } else if (presentationId?.includes("deep")) {
    initialTreeKey = "ai-2050-comprehensive";
  }

  return (
    <BranchingTreePresenter
      initialTreeKey={initialTreeKey}
      initialRiverNodeId={nodeParam}
    />
  );
}

export default function PresentModePage({
  params,
}: {
  params: { presentationId: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050811] text-slate-300 flex items-center justify-center font-mono text-sm">
          Loading Branching Present Studio…
        </div>
      }
    >
      <PresentModeInner presentationId={params.presentationId} />
    </Suspense>
  );
}
