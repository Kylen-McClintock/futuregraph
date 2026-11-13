"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ALL_SEED_FORECASTER_ACTORS,
  SEED_GRAPH_FORECAST_RUNS,
} from "@/data/starter-agents-seed";
import {
  computeCrowdDistribution,
  ComputedCrowdDistribution,
  computeGraphVarianceReport,
  decodePortableForecastBundle,
} from "@/lib/forecaster-engine";
import {
  evaluateGraphDistribution,
  getDefaultGraphDistribution,
  getRegisteredGraph,
} from "@/lib/graph-registry";
import {
  ActiveLensMode,
  CrowdEnsembleMode,
  ForecasterActor,
  GraphForecastRun,
  GraphVarianceReport,
  RegisteredGraphId,
} from "@/types/forecaster";

export interface UseGraphForecasterOptions {
  graphId: RegisteredGraphId;
  defaultLensMode?: ActiveLensMode;
}

export function useGraphForecaster({
  graphId,
  defaultLensMode = "default_creator",
}: UseGraphForecasterOptions) {
  const [actors, setActors] = useState<ForecasterActor[]>(
    () => ALL_SEED_FORECASTER_ACTORS
  );
  const [runs, setRuns] = useState<GraphForecastRun[]>(
    () => SEED_GRAPH_FORECAST_RUNS
  );
  const [activeLensMode, setActiveLensMode] =
    useState<ActiveLensMode>(defaultLensMode);
  const [crowdMode, setCrowdModeState] =
    useState<CrowdEnsembleMode>("all_ensemble");
  const [selectedActorHandle, setSelectedActorHandle] =
    useState<string>("kylen");
  const [showVarianceFromCrowd, setShowVarianceFromCrowd] =
    useState<boolean>(false);

  const [isWorldviewDrawerOpen, setIsWorldviewDrawerOpen] = useState(false);
  const [isAgentStudioOpen, setIsAgentStudioOpen] = useState(false);
  const [studioForkActor, setStudioForkActor] =
    useState<ForecasterActor | null>(null);
  const [studioInitialScope, setStudioInitialScope] = useState<
    "branch" | "graph" | "all_site"
  >("graph");
  const [studioBranchNodeId, setStudioBranchNodeId] = useState<string | null>(
    null
  );

  // Sync URL query params on mount (?forecaster=..., ?crowd=..., ?variance=1, ?agentRun=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const agentRunToken = params.get("agentRun");
    const forecasterParam = params.get("forecaster");
    const crowdParam = params.get("crowd") as CrowdEnsembleMode | null;
    const varianceParam = params.get("variance");

    if (
      crowdParam === "all_ensemble" ||
      crowdParam === "humans_markets" ||
      crowdParam === "agents_only"
    ) {
      setCrowdModeState(crowdParam);
    }

    if (agentRunToken) {
      const decoded = decodePortableForecastBundle(agentRunToken);
      if (decoded) {
        const portableActor: ForecasterActor = {
          id: `actor-${decoded.actor.handle}`,
          handle: decoded.actor.handle,
          displayName: decoded.actor.displayName,
          shortBadge:
            decoded.actor.actorType === "human" ? "Shared" : "Shared Agent",
          actorType: decoded.actor.actorType,
          roleLabel: decoded.actor.roleLabel || "Shared Forecaster",
          avatarInitials: decoded.actor.displayName
            .slice(0, 2)
            .toUpperCase(),
          isVerifiedEnsemble: false,
          createdAt: decoded.run.submittedAt || new Date().toISOString(),
          worldview: decoded.actor.worldview,
        };
        setActors((prev) => {
          const filtered = prev.filter((a) => a.handle !== portableActor.handle);
          return [portableActor, ...filtered];
        });
        setRuns((prev) => {
          const filtered = prev.filter(
            (r) =>
              !(
                r.graphId === decoded.run.graphId &&
                r.actorHandle === portableActor.handle
              )
          );
          return [decoded.run, ...filtered];
        });
        setSelectedActorHandle(portableActor.handle);
        setActiveLensMode("individual_actor");
        setShowVarianceFromCrowd(varianceParam !== "0");
      }
    } else if (forecasterParam) {
      if (forecasterParam === "crowd") {
        setActiveLensMode("crowd_wisdom");
      } else if (forecasterParam === "default") {
        setActiveLensMode("default_creator");
      } else {
        setSelectedActorHandle(forecasterParam.replace(/^@/, ""));
        setActiveLensMode("individual_actor");
        if (varianceParam === "1") {
          setShowVarianceFromCrowd(true);
        }
      }
    }
  }, []);

  // Fetch server-persisted actors & runs (merges Community Sandbox submissions)
  useEffect(() => {
    let cancelled = false;
    fetch(`/futuregraph/api/v1/agents?graphId=${encodeURIComponent(graphId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.actors) && data.actors.length > 0) {
          setActors((prev) => {
            const byHandle = new Map<string, ForecasterActor>();
            for (const a of data.actors as ForecasterActor[]) {
              byHandle.set(a.handle, a);
            }
            for (const p of prev) {
              if (!byHandle.has(p.handle)) byHandle.set(p.handle, p);
            }
            return Array.from(byHandle.values());
          });
        }
        if (Array.isArray(data.runs) && data.runs.length > 0) {
          setRuns((prev) => {
            const byKey = new Map<string, GraphForecastRun>();
            for (const p of prev) {
              byKey.set(`${p.graphId}::${p.actorHandle}`, p);
            }
            for (const r of data.runs as GraphForecastRun[]) {
              byKey.set(`${r.graphId}::${r.actorHandle}`, r);
            }
            return Array.from(byKey.values());
          });
        }
      })
      .catch(() => {
        // Offline / static fallback already seeded
      });
    return () => {
      cancelled = true;
    };
  }, [graphId]);

  const syncUrlParams = useCallback(
    (
      nextMode: ActiveLensMode,
      nextHandle: string,
      nextCrowd: CrowdEnsembleMode,
      nextVariance: boolean
    ) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (nextMode === "default_creator") {
        url.searchParams.delete("forecaster");
        url.searchParams.delete("variance");
      } else if (nextMode === "crowd_wisdom") {
        url.searchParams.set("forecaster", "crowd");
        url.searchParams.set("crowd", nextCrowd);
        url.searchParams.delete("variance");
      } else {
        url.searchParams.set("forecaster", nextHandle);
        if (nextVariance) {
          url.searchParams.set("variance", "1");
        } else {
          url.searchParams.delete("variance");
        }
      }
      window.history.replaceState({}, "", url.toString());
    },
    []
  );

  const graphSpec = useMemo(() => getRegisteredGraph(graphId), [graphId]);

  const graphRuns = useMemo(
    () => runs.filter((r) => r.graphId === graphId),
    [runs, graphId]
  );

  const actorsWithRunsOnGraph = useMemo(() => {
    const handlesWithRun = new Set(graphRuns.map((r) => r.actorHandle));
    return actors.filter((a) => handlesWithRun.has(a.handle));
  }, [actors, graphRuns]);

  const groupedActors = useMemo(() => {
    const starterAgentHandles = new Set([
      "kurzweil_horizon",
      "sentinel_treaty",
      "amdahl_realist",
      "tetlock_calib",
      "everett_sim",
    ]);
    const benchmarkHandles = new Set([
      "kylen",
      "metaculus_markets",
      "daniel_kokotajlo",
    ]);

    return {
      benchmarks: actorsWithRunsOnGraph.filter((a) =>
        benchmarkHandles.has(a.handle)
      ),
      worldviewAgents: actorsWithRunsOnGraph.filter((a) =>
        starterAgentHandles.has(a.handle)
      ),
      domainExperts: actorsWithRunsOnGraph.filter(
        (a) =>
          a.isVerifiedEnsemble &&
          !benchmarkHandles.has(a.handle) &&
          !starterAgentHandles.has(a.handle)
      ),
      communitySandbox: actorsWithRunsOnGraph.filter(
        (a) => !a.isVerifiedEnsemble
      ),
    };
  }, [actorsWithRunsOnGraph]);

  const selectedActor = useMemo(
    () =>
      actors.find((a) => a.handle === selectedActorHandle) ||
      actors.find((a) => a.handle === "kylen"),
    [actors, selectedActorHandle]
  );

  const selectedActorRun = useMemo(
    () =>
      graphRuns.find((r) => r.actorHandle === selectedActor?.handle) ||
      graphRuns.find((r) => r.actorHandle === "kylen"),
    [graphRuns, selectedActor]
  );

  const crowdDistribution: ComputedCrowdDistribution = useMemo(
    () => computeCrowdDistribution(graphId, crowdMode, actors, runs),
    [graphId, crowdMode, actors, runs]
  );

  const activeDistribution = useMemo(() => {
    if (activeLensMode === "crowd_wisdom") {
      return {
        nodeOverallProbabilities: crowdDistribution.nodeOverallProbabilities,
        canonicalNodeProbabilities: crowdDistribution.canonicalNodeProbabilities,
        normalizedConditionalSplits:
          crowdDistribution.normalizedConditionalSplits,
        normalizedRootPriors: crowdDistribution.normalizedRootPriors,
      };
    }
    if (activeLensMode === "individual_actor" && selectedActorRun) {
      return evaluateGraphDistribution(graphId, {
        rootPriors: selectedActorRun.rootPriors,
        conditionalSplits: selectedActorRun.conditionalSplits,
      });
    }
    return getDefaultGraphDistribution(graphId);
  }, [activeLensMode, crowdDistribution, graphId, selectedActorRun]);

  // Variance report for the active individual actor (or Kylen when default_creator has a creator run)
  const varianceTargetRun = useMemo(() => {
    if (activeLensMode === "individual_actor") return selectedActorRun;
    if (
      activeLensMode === "default_creator" &&
      graphSpec?.defaultCreatorHandle
    ) {
      return graphRuns.find(
        (r) => r.actorHandle === graphSpec.defaultCreatorHandle
      );
    }
    return selectedActorRun;
  }, [activeLensMode, graphRuns, graphSpec, selectedActorRun]);

  const varianceReport: GraphVarianceReport | null = useMemo(() => {
    if (!varianceTargetRun) return null;
    return computeGraphVarianceReport(
      graphId,
      varianceTargetRun,
      crowdMode,
      actors,
      runs
    );
  }, [actors, crowdMode, graphId, runs, varianceTargetRun]);

  const selectDefaultBaseline = useCallback(() => {
    setActiveLensMode("default_creator");
    setShowVarianceFromCrowd(false);
    syncUrlParams("default_creator", selectedActorHandle, crowdMode, false);
  }, [crowdMode, selectedActorHandle, syncUrlParams]);

  const selectCrowdWisdom = useCallback(
    (nextCrowdMode?: CrowdEnsembleMode) => {
      const m = nextCrowdMode || crowdMode;
      setCrowdModeState(m);
      setActiveLensMode("crowd_wisdom");
      setShowVarianceFromCrowd(false);
      syncUrlParams("crowd_wisdom", selectedActorHandle, m, false);
    },
    [crowdMode, selectedActorHandle, syncUrlParams]
  );

  const selectIndividualActor = useCallback(
    (handle: string, autoEnableVariance?: boolean) => {
      const clean = handle.replace(/^@/, "");
      setSelectedActorHandle(clean);
      setActiveLensMode("individual_actor");
      const nextVar =
        autoEnableVariance !== undefined
          ? autoEnableVariance
          : showVarianceFromCrowd;
      setShowVarianceFromCrowd(nextVar);
      syncUrlParams("individual_actor", clean, crowdMode, nextVar);
    },
    [crowdMode, showVarianceFromCrowd, syncUrlParams]
  );

  const setCrowdMode = useCallback(
    (m: CrowdEnsembleMode) => {
      setCrowdModeState(m);
      if (activeLensMode === "crowd_wisdom") {
        syncUrlParams("crowd_wisdom", selectedActorHandle, m, false);
      }
    },
    [activeLensMode, selectedActorHandle, syncUrlParams]
  );

  const toggleVarianceFromCrowd = useCallback(() => {
    setShowVarianceFromCrowd((prev) => {
      const next = !prev;
      // If user clicks Δ vs. Crowd while on default_creator and a creator actor exists, keep default or switch cleanly
      syncUrlParams(activeLensMode, selectedActorHandle, crowdMode, next);
      return next;
    });
  }, [activeLensMode, crowdMode, selectedActorHandle, syncUrlParams]);

  const openAgentStudio = useCallback(
    (opts?: {
      forkActor?: ForecasterActor | null;
      scope?: "branch" | "graph" | "all_site";
      branchNodeId?: string | null;
    }) => {
      setStudioForkActor(opts?.forkActor ?? null);
      setStudioInitialScope(opts?.scope ?? "graph");
      setStudioBranchNodeId(opts?.branchNodeId ?? null);
      setIsAgentStudioOpen(true);
    },
    []
  );

  const registerLocalOrSavedRuns = useCallback(
    (newActor: ForecasterActor, newRuns: GraphForecastRun[]) => {
      setActors((prev) => {
        const filtered = prev.filter((a) => a.handle !== newActor.handle);
        return [newActor, ...filtered];
      });
      setRuns((prev) => {
        const nextMap = new Map<string, GraphForecastRun>();
        for (const r of prev) {
          nextMap.set(`${r.graphId}::${r.actorHandle}`, r);
        }
        for (const nr of newRuns) {
          nextMap.set(`${nr.graphId}::${nr.actorHandle}`, nr);
        }
        return Array.from(nextMap.values());
      });
      setSelectedActorHandle(newActor.handle);
      setActiveLensMode("individual_actor");
      setShowVarianceFromCrowd(true);
      syncUrlParams("individual_actor", newActor.handle, crowdMode, true);
    },
    [crowdMode, syncUrlParams]
  );

  return {
    graphSpec,
    actors,
    runs,
    graphRuns,
    groupedActors,
    activeLensMode,
    crowdMode,
    selectedActorHandle,
    selectedActor,
    selectedActorRun,
    showVarianceFromCrowd,
    crowdDistribution,
    activeDistribution,
    varianceReport,
    selectDefaultBaseline,
    selectCrowdWisdom,
    selectIndividualActor,
    setCrowdMode,
    setShowVarianceFromCrowd,
    toggleVarianceFromCrowd,
    isWorldviewDrawerOpen,
    setIsWorldviewDrawerOpen,
    isAgentStudioOpen,
    setIsAgentStudioOpen,
    studioForkActor,
    studioInitialScope,
    studioBranchNodeId,
    openAgentStudio,
    registerLocalOrSavedRuns,
  };
}
