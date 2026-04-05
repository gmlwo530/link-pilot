# PRODUCT - link-pilot

## Problem
People save many links but rarely come back to consume them. link-pilot closes the gap between "saved" and "actually read."

## Product Goals
- Save pages quickly
- Keep unread items visible and manageable
- Lower reading friction with AI summaries
- Reduce retrieval cost via tags/search/sort

## Target Users
- Individuals who collect many resources but have low consumption rate
- Research, planning, and engineering users who need practical curation

## MVP Scope (In Scope)
1. Save current tab from Chrome Extension (`⌘ + ⌥ + ⇧ + B`)
2. Local server API + SQLite persistence
3. unread/read status management
4. Per-bookmark summary request and result display
5. Basic discovery via tags, search, and sorting

## Out of Scope
- Multi-user collaboration permissions
- Cloud sync
- Advanced personalized recommendations
- Mobile app

## Milestones
### M0. Foundation Stabilization (Current)
- [x] Extension/Server/DB scaffolding
- [x] Core save/list/summary API wiring
- [ ] Save reliability checks (dedupe/errors/messages)
- [ ] Baseline UX cleanup (list/filter/state change)

### M1. Reading Conversion Improvement
- [ ] Better unread prioritization
- [ ] Better summary retry UX
- [ ] Stronger tag-based filtering
- [ ] Weekly consumption stats

### M2. Operational Convenience
- [ ] Import/Export hardening
- [ ] Operations playbook refinement
- [ ] Performance checks

## Current Week Priorities
1. Save reliability and error handling
2. Simpler unread → read conversion flow
3. Better summary failure/retry messaging
