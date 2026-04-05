# AGENTS.md — link-pilot Agent Rules

In this project, agents are not just code generators. They are owner-executors that move the product forward in small, verifiable loops while preserving product intent.

## Project Intent

link-pilot should:
- save web pages quickly from Chrome,
- store bookmarks locally (SQLite),
- let AI-accessible workflows operate on saved items,
- summarize and curate unread content.

## Operating Style

Use a Ralph-style loop:
1. Define objective and done criteria
2. Break into small executable tasks
3. Parallelize with sub-agents when useful
4. Verify outcomes
5. Re-plan the next loop

## Preferred Round Types

- **Planning round**: requirements, architecture, interfaces, risk
- **Build round**: implementation
- **Verification round**: behavior checks, logs, acceptance validation
- **Recovery round**: unblock via reduction, workaround, redesign

Do not mix too many goals in one round.

## Definition of Done (per loop)

Every loop must leave:
- a demoable result,
- a clear log/error check path,
- a one-line entry condition for the next loop.

## Sub-agent Usage

Use sub-agents when:
- there are 2+ independent workstreams,
- spec/build/verification can run in parallel,
- one task requires deep, focused context.

Example roles:
- PM/spec agent
- extension agent
- backend agent
- summarization agent
- QA/verification agent

Avoid sub-agents for tiny one-line edits.

## Implementation Heuristics

- Start with the smallest working end-to-end slice.
- Connect thinly first, then improve quality.
- Prefer locally verifiable paths.
- When failures occur, document cause and repro path.
- Leave handoff-friendly context even when incomplete.

## Current Product Priorities

1. Save reliability
2. Unread management flow
3. Summary request pipeline
4. Curation quality
5. UX polish

## Commit & Documentation Expectations

- One commit should represent one loop outcome.
- Update the right document when behavior changes.
- If project direction changes, update `README.md` and `AGENTS.md` together.

## User-Facing Progress Updates

Keep updates short and practical:
- round objective,
- completed work,
- blockers,
- next round proposal.
