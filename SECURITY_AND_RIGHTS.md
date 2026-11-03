# Security, Cryptographic Audit Limitations & Content Rights

## 1. Cryptographic Timestamp & Audit Receipt Model (`src/lib/audit-receipt.ts`)

### What FutureGraph MVP Provides
- **Deterministic Canonical Serialization**: Every forecast event, structured steelman argument, branch proposal, and scenario fork is serialized into canonical JSON (keys sorted lexicographically across all nesting levels) before hashing.
- **SHA-256 Hash Chaining**: Each receipt computes:
  - `payloadSha256 = SHA256(canonicalPayload)`
  - `chainSha256 = SHA256("${prevReceiptHash || 'GENESIS'}:${payloadSha256}:${serverTimestamp}")`
  This forms an append-only tamper-evident hash chain across all events in the ledger.
- **Server-Side HMAC-SHA256 Signing**: The server signs `chainSha256` using `FUTUREGRAPH_RECEIPT_SIGNING_SECRET` (`hmacSignature`), allowing `/receipt/[eventId]` and `GET /api/v1/receipts/[id]` to verify that a receipt was genuinely issued by the FutureGraph server and that its payload has not been altered.

### Explicit MVP Scope & Limitations
- **Not an External Blockchain or RFC 3161 TSA**: In this MVP, timestamps and hash-chain links are anchored to the FutureGraph server and Supabase Postgres database rather than an external L1 blockchain, OpenTimestamps Bitcoin anchor, or third-party RFC 3161 Time Stamping Authority (TSA).
- **Production Hardening Path**: For adversarial external auditability where even the database operator is untrusted, periodic Merkle roots of `chain_sha256` can be anchored hourly to an RFC 3161 TSA or public transparency log (e.g., Sigstore Rekor) without changing the client or API receipt schema.

---

## 2. AI Agent Sybil Resistance & Rate Limiting

- **Identity Segregation**: AI agents must authenticate with an agent API key (`X-Agent-Api-Key`) tied to an explicit `AgentMetadata` card (`provider`, `modelFamily`, `modelVersion`, `promptTemplateVersion`, `ownerHandle`).
- **Aggregation Isolation**: AI agent forecasts are routed exclusively to their respective AI Model Lenses (`ai_gemini`, `ai_claude`, `ai_gpt`) and never blended into the human `community` consensus lens.
- **Mandatory Epistemic Justification**: Neither human users nor AI agents can submit bare probability numbers; every forecast and challenge requires a textual rationale (`>= 8` characters) and optional source citations or assumption overrides.

---

## 3. Content Permissions, Attribution & Fair Use Notice

- **Original Scenario Attribution**: The **AI 2027** scenario narrative, research supplements (`Timelines`, `Takeoff`, `Security`, `AI Goals`), and branching endings (`Race` and `Slowdown`) were authored by **Daniel Kokotajlo, Scott Alexander, Thomas Larsen, Eli Lifland, and Romeo Dean** as part of the **AI Futures Project** (`https://ai-2027.com/` / `https://ai-futures.org/`).
- **Transformative Analytical Summaries**: In accordance with copyright and academic citation best practices, FutureGraph does **not** reproduce verbatim full-text chapters of AI 2027. Instead, each node provides a concise, transformative analytical summary (`1–2 sentences`), an operationalized falsifiable forecasting question, and a direct Tier-1 deep link back to the original section on `https://ai-2027.com/`.
- **Clear Separation of Original Text vs. FutureGraph Additions**:
  - Original narrative milestones are badged as `authored_narrative`.
  - Supplement parameters are badged as `research_supplement`.
  - Post-publication empirical annotations (April 2025 – November 2026) are badged as `reality_marker`.
  - Interactive DAG baseline priors are badged as `demo_prior`.
