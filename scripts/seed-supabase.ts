import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { getInitialDataset } from "../src/data/ai2027-seed";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const data = getInitialDataset();
  console.log(`Seeding FutureGraph database at ${url}...`);

  // 1. Profiles
  const profileRows = data.profiles.map((p) => ({
    id: p.id,
    handle: p.handle,
    display_name: p.displayName,
    role: p.role,
    participant_type: p.participantType,
    bio: p.bio,
    credentials: p.credentials || null,
    avatar_url: p.avatarUrl || null,
    joined_at: p.joinedAt,
  }));
  const { error: profErr } = await supabase.from("profiles").upsert(profileRows);
  if (profErr) throw new Error("Profiles seed error: " + profErr.message);
  console.log(`✓ Seeded ${profileRows.length} profiles`);

  // 2. Agents
  const agentRows = data.profiles
    .filter((p) => p.agentMetadata)
    .map((p) => ({
      id: `agent-${p.handle}`,
      profile_id: p.id,
      provider: p.agentMetadata!.provider,
      model_family: p.agentMetadata!.modelFamily,
      model_version: p.agentMetadata!.modelVersion,
      prompt_template_version: p.agentMetadata!.promptTemplateVersion,
      owner_handle: p.agentMetadata!.ownerHandle,
      is_verified_provider: p.agentMetadata!.isVerifiedProvider,
      is_independent: p.agentMetadata!.isIndependent,
    }));
  const { error: agentErr } = await supabase.from("agents").upsert(agentRows);
  if (agentErr) throw new Error("Agents seed error: " + agentErr.message);
  console.log(`✓ Seeded ${agentRows.length} AI agents`);

  // 3. Scenarios (Official + Forks)
  const scenarioRows = [
    {
      id: data.scenario.id,
      slug: data.scenario.slug,
      title: data.scenario.title,
      subtitle: data.scenario.subtitle,
      topic: "AI Futures",
      is_canonical: true,
      parent_scenario_id: null,
      forked_from_version: null,
      owner_id: "prof-elena-vance",
      visibility: "public",
      current_version: data.scenario.version,
      attribution_text: data.scenario.authors.join(", "),
      source_url: "https://ai-2027.com/",
      published_at: "2025-04-03T00:00:00Z",
    },
    ...data.forks.map((f) => ({
      id: f.id,
      slug: f.slug,
      title: f.title,
      subtitle: f.subtitle,
      topic: "AI Futures",
      is_canonical: false,
      parent_scenario_id: f.parentScenarioId,
      forked_from_version: f.forkedFromVersion,
      owner_id: f.ownerId,
      visibility: "public",
      current_version: 1,
      attribution_text: `${f.ownerName} (@${f.ownerHandle}) — Fork of AI 2027`,
      source_url: "https://ai-2027.com/research/takeoff-forecast",
      published_at: f.createdAt,
    })),
  ];
  const { error: scenErr } = await supabase.from("scenarios").upsert(scenarioRows);
  if (scenErr) throw new Error("Scenarios seed error: " + scenErr.message);
  console.log(`✓ Seeded ${scenarioRows.length} scenarios`);

  // 4. Scenario Versions
  const { error: verErr } = await supabase.from("scenario_versions").upsert([
    {
      id: "sv-ai-2027-v1",
      scenario_id: data.scenario.id,
      version_number: 1,
      summary: data.scenario.versionLabel,
      created_by: "prof-elena-vance",
      snapshot_hash: "sha256:ai2027_canonical_v1_snapshot_20261102",
    },
  ]);
  if (verErr) throw new Error("Scenario versions seed error: " + verErr.message);

  // 5. Nodes
  const nodeRows = data.nodes.map((n) => ({
    id: n.id,
    scenario_id: n.scenarioId,
    logical_id: n.logicalId,
    node_type: n.nodeType,
    provenance_type: n.provenanceType,
    branch_track: n.branchTrack,
    chapter: n.chapter,
    date_label: n.dateLabel,
    sort_date: n.sortDate,
    title: n.title,
    summary: n.summary,
    detailed_description: n.detailedDescription,
    plain_english_definition: n.plainEnglishDefinition,
    outcome_set: n.outcomeSet,
    observed_status: n.observedStatus,
    verification_note: n.verificationNote,
    source_url: n.sourceUrl,
    source_section_anchor: n.sourceSectionAnchor || null,
    author_as_of: n.authorAsOf,
    current_as_of: n.currentAsOf,
    position_x: n.positionX,
    position_y: n.positionY,
    linked_opportunities: n.linkedOpportunities,
    conflict_disclosure: n.conflictDisclosure || null,
  }));
  const { error: nodeErr } = await supabase.from("nodes").upsert(nodeRows);
  if (nodeErr) throw new Error("Nodes seed error: " + nodeErr.message);
  console.log(`✓ Seeded ${nodeRows.length} nodes`);

  // 6. Edges
  const edgeRows = data.edges.map((e) => ({
    id: e.id,
    scenario_id: e.scenarioId,
    source_node_id: e.sourceNodeId,
    target_node_id: e.targetNodeId,
    relation_type: e.relationType,
    condition_label: e.conditionLabel,
    parent_outcome: e.parentOutcome,
    is_modeled: e.isModeled,
    default_conditional_prob: e.defaultConditionalProb ?? null,
    assumption_note: e.assumptionNote,
    sort_order: e.sortOrder,
  }));
  const { error: edgeErr } = await supabase.from("edges").upsert(edgeRows);
  if (edgeErr) throw new Error("Edges seed error: " + edgeErr.message);
  console.log(`✓ Seeded ${edgeRows.length} edges`);

  // 7. Forecast Questions
  const questionRows = data.nodes
    .filter((n) => n.question)
    .map((n) => {
      const q = n.question!;
      return {
        id: q.id,
        node_id: q.nodeId,
        question_text: q.questionText,
        resolution_criteria: q.resolutionCriteria,
        resolution_source: q.resolutionSource,
        resolution_owner: q.resolutionOwner,
        horizon_date: q.horizonDate,
        close_date: q.closeDate,
        conditioning_description: q.conditioningDescription || null,
        exclusive_group_id: q.exclusiveGroupId || null,
        is_other_branch: q.isOtherBranch || false,
        probability_model_role: q.modelRole,
        cpt_table: q.cptTable || null,
        author_documented_prob: q.authorDocumentedProb ?? null,
        author_prob_citation: q.authorProbCitation || null,
        demo_hypothesis_prob: q.demoHypothesisProb,
        resolved_outcome: q.resolvedOutcome ?? null,
        resolved_at: q.resolvedAt || null,
        dispute_status: q.disputeStatus,
      };
    });
  const { error: qErr } = await supabase.from("forecast_questions").upsert(questionRows);
  if (qErr) throw new Error("Forecast questions seed error: " + qErr.message);
  console.log(`✓ Seeded ${questionRows.length} operationalized forecast questions`);

  // 8. Sources & Node Sources
  const sourceRows = data.sources.map((s) => ({
    id: s.id,
    url: s.url,
    source_type: s.sourceType,
    title: s.title,
    authors: s.authors,
    publisher: s.publisher,
    published_at: s.publishedAt,
    retrieved_at: s.retrievedAt,
    media_start_seconds: s.mediaStartSeconds ?? null,
    excerpt_paraphrase: s.excerptParaphrase,
    credibility_note: s.credibilityNote,
    is_ai_summarized: s.isAiSummarized,
  }));
  const { error: srcErr } = await supabase.from("sources").upsert(sourceRows);
  if (srcErr) throw new Error("Sources seed error: " + srcErr.message);

  const nodeSourceRows = data.nodeSources.map((ns) => ({
    id: ns.id,
    node_id: ns.nodeId,
    source_id: ns.sourceId,
    relationship: ns.relationship,
    relevance_note: ns.relevanceNote,
    added_by: ns.addedBy === "elena_vance" ? "prof-elena-vance" : "prof-marcus-chen",
    created_at: ns.createdAt,
  }));
  const { error: nsErr } = await supabase.from("node_sources").upsert(nodeSourceRows);
  if (nsErr) throw new Error("Node sources seed error: " + nsErr.message);
  console.log(`✓ Seeded ${sourceRows.length} sources & ${nodeSourceRows.length} evidence links`);

  // 9. Arguments & Comments
  const argRows = data.arguments.map((a) => ({
    id: a.id,
    node_id: a.nodeId,
    author_id: a.authorId,
    stance: a.stance,
    thesis: a.thesis,
    reasoning: a.reasoning,
    target_assumption: a.targetAssumption || null,
    source_ids: a.sourceIds,
    moderation_state: "active",
    payload_hash: a.payloadHash,
    created_at: a.createdAt,
  }));
  const { error: argErr } = await supabase.from("arguments").upsert(argRows);
  if (argErr) throw new Error("Arguments seed error: " + argErr.message);

  const commentRows = data.comments.map((c) => ({
    id: c.id,
    node_id: c.nodeId,
    argument_id: c.argumentId || null,
    parent_comment_id: c.parentCommentId || null,
    author_id: c.authorId,
    body: c.body,
    moderation_state: "active",
    created_at: c.createdAt,
  }));
  const { error: cmtErr } = await supabase.from("comments").upsert(commentRows);
  if (cmtErr) throw new Error("Comments seed error: " + cmtErr.message);
  console.log(`✓ Seeded ${argRows.length} arguments & ${commentRows.length} comments`);

  // 10. Append-only Forecast Events & Audit Receipts (insert only if not present)
  const { data: existingEvents } = await supabase.from("forecast_events").select("id");
  const existingEventIds = new Set((existingEvents || []).map((e) => e.id));
  const newEvents = data.forecastEvents
    .filter((fe) => !existingEventIds.has(fe.id))
    .map((fe) => ({
      id: fe.id,
      node_id: fe.nodeId,
      question_id: fe.questionId || null,
      scenario_version: fe.scenarioVersion,
      forecaster_id: fe.forecasterId,
      agent_id: fe.forecasterType === "ai_agent" ? `agent-${fe.forecasterHandle}` : null,
      lens_category: fe.lensCategory,
      probability: fe.probability,
      uncertainty_lower: fe.uncertaintyLower ?? null,
      uncertainty_upper: fe.uncertaintyUpper ?? null,
      conditional_overrides: fe.conditionalOverrides || {},
      rationale: fe.rationale,
      cited_urls: fe.citedUrls,
      assumptions: fe.assumptions,
      parent_event_id: fe.parentEventId || null,
      payload_hash: fe.payloadHash,
      prev_chain_hash: fe.prevChainHash || null,
      chain_hash: fe.chainHash,
      server_timestamp: fe.serverTimestamp,
    }));

  if (newEvents.length > 0) {
    const { error: feErr } = await supabase.from("forecast_events").insert(newEvents);
    if (feErr) throw new Error("Forecast events seed error: " + feErr.message);
  }

  const { data: existingReceipts } = await supabase.from("audit_receipts").select("event_id");
  const existingReceiptIds = new Set((existingReceipts || []).map((r) => r.event_id));
  const newReceipts = data.auditReceipts
    .filter((r) => !existingReceiptIds.has(r.eventId))
    .map((r) => ({
      event_id: r.eventId,
      entity_type: r.entityType,
      entity_id: r.entityId,
      contributor_id: r.contributorId,
      agent_metadata: r.agentMetadata || null,
      scenario_version: r.scenarioVersion,
      canonical_payload: r.canonicalPayload,
      payload_sha256: r.payloadSha256,
      prev_receipt_hash: r.prevReceiptHash || null,
      chain_sha256: r.chainSha256,
      hmac_signature: r.hmacSignature,
      server_timestamp: r.serverTimestamp,
    }));

  if (newReceipts.length > 0) {
    const { error: recErr } = await supabase.from("audit_receipts").insert(newReceipts);
    if (recErr) throw new Error("Audit receipts seed error: " + recErr.message);
  }
  console.log(`✓ Seeded ${data.forecastEvents.length} forecast events & ${data.auditReceipts.length} SHA-256 receipts`);

  // 11. Presentations & Scenes
  const presRows = data.presentations.map((p) => ({
    id: p.id,
    scenario_id: p.scenarioId,
    pinned_scenario_version: p.pinnedScenarioVersion,
    author_id: p.authorId,
    title: p.title,
    subtitle: p.subtitle,
    aspect_ratio: p.aspectRatio,
    visibility: p.visibility,
    created_at: p.createdAt,
  }));
  const { error: presErr } = await supabase.from("presentations").upsert(presRows);
  if (presErr) throw new Error("Presentations seed error: " + presErr.message);

  const sceneRows = data.presentations.flatMap((p) =>
    p.scenes.map((s) => ({
      id: s.id,
      presentation_id: s.presentationId,
      scene_order: s.sceneOrder,
      headline: s.headline,
      annotation: s.annotation,
      narration_notes: s.narrationNotes,
      focused_node_id: s.focusedNodeId,
      isolated_branch_track: s.isolatedBranchTrack || "all",
      selected_lens: s.selectedLens,
      comparison_lens: s.comparisonLens || null,
      override_node_id: s.overrideNodeId || null,
      override_probability: s.overrideProbability ?? null,
      camera_x: s.cameraX,
      camera_y: s.cameraY,
      camera_zoom: s.cameraZoom,
      duration_seconds: s.durationSeconds,
    }))
  );
  const { error: sceneErr } = await supabase.from("presentation_scenes").upsert(sceneRows);
  if (sceneErr) throw new Error("Presentation scenes seed error: " + sceneErr.message);
  console.log(`✓ Seeded ${presRows.length} presentations & ${sceneRows.length} scenes`);

  // 12. Branch Proposals & Policy Interventions
  const propRows = data.proposals.map((p) => ({
    id: p.id,
    scenario_id: p.scenarioId,
    parent_node_id: p.parentNodeId,
    proposer_id: p.proposerId,
    proposal_type: p.proposalType,
    proposed_title: p.proposedTitle,
    proposed_summary: p.proposedSummary,
    conditional_assumption: p.conditionalAssumption,
    suggested_probability: p.suggestedProbability ?? null,
    source_url: p.sourceUrl || null,
    status: p.status,
    payload_hash: p.payloadHash,
    created_at: p.createdAt,
  }));
  const { error: propErr } = await supabase.from("branch_proposals").upsert(propRows);
  if (propErr) throw new Error("Branch proposals seed error: " + propErr.message);

  const polRows = data.policyInterventions.map((pol) => ({
    id: pol.id,
    slug: pol.slug,
    title: pol.title,
    short_label: pol.shortLabel,
    description: pol.description,
    causal_model_caveat: pol.causalModelCaveat,
    linked_node_ids: pol.linkedNodeIds,
    outcome_estimates: pol.outcomeEstimates,
    is_hypothetical: pol.isHypothetical,
  }));
  const { error: polErr } = await supabase.from("policy_interventions").upsert(polRows);
  if (polErr) throw new Error("Policy interventions seed error: " + polErr.message);
  console.log(`✓ Seeded ${propRows.length} branch proposals & ${polRows.length} FairMarkets policy interventions`);

  console.log("🎉 FutureGraph Supabase database seeding complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
