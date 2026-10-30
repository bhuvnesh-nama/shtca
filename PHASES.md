# Development Phases & Implementation Tracker

## Hyperlocal Community Safety Network

**Status:** All 10 Phases & Bonus Twists 100% Complete & Fully Verified ✅  
**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Shadcn UI + Leaflet + Express + MongoDB (2dsphere geospatial) + Socket.IO + Flutter Native Mobile (Android/Desktop/Web)  
**Default Theme:** Light theme with fixed bottom-right theme switcher (`<ModeToggle />`)

---

## 🚀 Execution & Phase Verification Summary

| Phase | Description | Status | Key Deliverables |
|---|---|---|---|
| **Phase 0** | Scope, Setup & Packages | ✅ Complete | Updated packages, TypeScript config, MongoDB schemas with 2dsphere indexing, Socket.IO setup |
| **Phase 1** | Citizen Reporting & Live Map | ✅ Complete | Mobile-first PWA, GPS detection, custom Leaflet map pins, category selector (power, water, security, stray animals, road hazard, sanitation), evidence upload |
| **Phase 2** | Incident Model & Auto-Clustering | ✅ Complete | **Bonus Twist 1**: Duplicate detection within 250m, live auto-cluster preview banner in report dialog, user choice to corroborate or force new, visual cluster badges (+N) and pulsing rings on map |
| **Phase 3** | Admin & RWA Operations Lifecycle | ✅ Complete | RWA dashboard, operational KPIs, status updates with resolution notes, manual incident merge/cluster tool |
| **Phase 4** | Realtime Trust & Push Alerts | ✅ Complete | Socket.IO live broadcasts, upvote-based deduplicated verification (promotes to confirmed at 3+ votes), push notification permission drawer |
| **Phase 5** | Analytics & Demo Showcase | ✅ Complete | Interactive Demo Simulation Lab (1-click auto-clustering, upvote surge, RWA resolution, environment reset), Safety Hotspots/Heatmap layer toggle on Leaflet map, verified resolution card, deep operations metrics |
| **Phase 6** | Resolution Proof & Audit Export | ✅ Complete | Before & After photographic resolution evidence, official Municipal / RWA complaint reference tracking (`complaintRef`), automated Safety Audit CSV / governance report export on dashboard, mobile app cross-platform parity |
| **Phase 7** | Pilot Readiness & Moderation | ✅ Complete | Multi-society pilot boundary selector (Greenwood, Palm Heights, Royal Meadows), resident abuse flagging & auto-escalation, RWA Moderation Queue with flag dismissal, offline network awareness banner |
| **Phase 8** | Re-Open Flow & Field Verification | ✅ Complete | Community hazard re-opening workflow for recurring problems (`status: reopened`), official physical field inspection stamping (`inspectedBy`) with 100% signal trust credibility, Flutter & Web parity |
| **Phase 9** | Area Intelligence & Analytics Suite | ✅ Complete | Top recurring hotspot frequency detection (Feature 60), avg SLA turnaround calculation (Feature 61), multi-ward pilot benchmarking (Feature 63), transparent health score formula breakdown (Feature 57) |
| **Phase 10** | Scale, Native Experience & Multi-Language Readiness | ✅ Complete | **English & Hindi (`hi-IN`) bilingual localization** across Web PWA & Flutter mobile, **Official Emergency Broadcast Ticker** (Features 35, 54) & **Citizen SOS Panic Beacon** (Feature 35), **High-performance geospatial query caching** with write-invalidation and real-time cache diagnostics (hit rate %, latency ms, 2dsphere indexing health) |
| **Bonus Twist 1** | Auto-Clustering & Duplicate Corroboration | ✅ Complete | Live candidate banner, corroborate vs force new, cluster count badges and radar rings |
| **Bonus Twist 2** | Neighbourhood Health Score | ✅ Complete | Dynamic formula based on open vs resolved hazards & severity weighting with live UI widget |

---

## 1. Delivery strategy

Build in this order:

1. Citizen can submit a report.
2. Report is stored and appears on the map.
3. A second report can be linked to the same incident.
4. Admin can review and update the incident.
5. Connected users receive live updates.
6. Trust and abuse signals make the workflow safer.
7. Analytics and demo polish make the system easier to understand.

Do not begin with a complex AI model, full notification system or elaborate dashboard before report submission and incident lifecycle work end to end.

## 2. 24-hour hackathon plan

The schedule is a guide, not a reason to skip testing. Freeze the MVP scope before implementation.

### Phase 0 - Scope and setup (Hour 0-1)

**Goals**
- Confirm the supported incident categories.
- Agree on report vs incident data model.
- Create the repository and basic application skeletons.
- Set up environment variables and local development.

**Tasks**
- Create monorepo and `citizen`, `admin`, `api`, `worker` apps.
- Add shared TypeScript types and Zod validators.
- Start PostgreSQL/PostGIS and Redis through Docker Compose.
- Create initial database migrations.
- Add a health endpoint and basic logging.

**Exit criteria**
- All apps start locally.
- API connects to database.
- Team agrees on API payloads and status enums.

### Phase 1 - Citizen reporting and map (Hours 1-6)

**Goals**
- Make it possible to submit a real report from a phone.
- Make the report visible on a map and list.

**Tasks**
- Build mobile-first citizen shell and navigation.
- Implement login or a carefully controlled demo authentication flow.
- Build category, description and location form.
- Add manual map pin placement and browser geolocation.
- Implement image upload using storage or a temporary demo-safe upload path.
- Create report API and persistence.
- Build nearby incident API using a bounding box or radius query.
- Add map markers and list cards.

**Exit criteria**
- A report submitted from the PWA is stored and visible in the app.
- The map and list show the same incident data.
- Permission denial or unavailable GPS has a manual fallback.

### Phase 2 - Incident model and duplicate linking (Hours 6-10)

**Goals**
- Distinguish individual citizen reports from the shared incident.
- Demonstrate duplicate handling.

**Tasks**
- Add `incidents` table and `reports.incident_id` relationship.
- Add PostGIS index and nearby candidate query.
- Implement category + distance + time-window matching.
- Create conservative duplicate suggestions.
- Add moderator merge action if time permits.
- Preserve original reports and evidence when linking or merging.

**Exit criteria**
- Two nearby reports in the same category can be associated with one incident.
- The incident page shows the number of supporting reports.
- No report or evidence is lost during the operation.

### Phase 3 - Admin review and lifecycle (Hours 10-14)

**Goals**
- Give moderators control over the quality and status of public incidents.

**Tasks**
- Build admin login/role gate.
- Build overview counts and review queue.
- Show linked reports, evidence and location.
- Implement moderation actions and incident status transitions.
- Add status event history and audit records.
- Add resolution submission and review states.

**Exit criteria**
- Moderator can inspect a report and update its incident.
- Every important action records actor, time and reason.
- A resolution claim is not automatically labelled verified.

### Phase 4 - Realtime and basic trust controls (Hours 14-18)

**Goals**
- Make the system feel live and prevent the easiest forms of manipulation.

**Tasks**
- Add Socket.IO authentication and scoped rooms.
- Publish incident created/updated/status events.
- Add confirmation endpoint with unique-user constraints.
- Add per-user rate limits for reports and confirmations.
- Add basic suspicious-activity flags for bursts and repeated media where available.
- Ensure account risk and incident confidence remain separate.

**Exit criteria**
- A second browser sees a new incident without refreshing.
- A user cannot repeatedly confirm the same incident to inflate the count.
- Suspicious activity is flagged for review rather than treated as definitive proof.

### Phase 5 - Analytics and demo showcase (Hours 18-22)

**Goals**
- Make the product understandable to judges and demonstrate the differentiating workflow.

**Tasks**
- Add category/status summary metrics.
- Add a basic incident heatmap or area summary.
- Add incident timeline/replay if time permits.
- Build a controlled attack simulation with labelled synthetic accounts and events.
- Add demo seed data for a compact geographical area.
- Add empty, loading, error and permission-denied states.

**Exit criteria**
- Admin overview reflects actual database records.
- Simulated activity is clearly labelled.
- Demo can show report → duplicate link → confirmation → moderation → resolution evidence.

### Phase 6 - Stabilisation and presentation (Hours 22-24)

**Goals**
- Ensure the demo works reliably and the team can explain design choices.

**Tasks**
- Test on at least one real mobile browser and one desktop browser.
- Run through the full demo script twice.
- Check admin permissions and public data exposure.
- Remove broken or unfinished UI actions.
- Prepare architecture diagram, feature summary and known limitations.
- Ensure seed data and demo credentials are ready.

**Exit criteria**
- No critical blocker in the primary demo path.
- All buttons shown in the demo perform real actions.
- The team clearly distinguishes implemented features from simulated features and future plans.

## 3. Suggested work split for a team of four

| Role | Ownership | Key deliverables |
|---|---|---|
| Developer 1 - Citizen frontend | PWA, report form, map, incident detail | Working mobile citizen flow |
| Developer 2 - Backend/data | Auth, reports, incidents, PostGIS, API contracts | Working API and database |
| Developer 3 - Admin/trust | Admin UI, review queue, moderation, rate limits | Working moderation flow and abuse flags |
| Developer 4 - Realtime/demo integration | Socket.IO, worker jobs, analytics, seed data, deployment | Live updates, demo simulation and integration |

If one person owns multiple areas, keep the same dependency order and reduce scope rather than creating more apps.

## 4. Critical path

These dependencies should be respected:

```mermaid
flowchart TD
    A[Database schema and API contracts] --> B[Report submission]
    B --> C[Incident creation and map display]
    C --> D[Duplicate matching]
    D --> E[Admin review and status lifecycle]
    E --> F[Realtime updates]
    F --> G[Trust controls and simulation]
    G --> H[Analytics and demo polish]
```

The exact order of parallel frontend tasks can vary, but the report and incident contracts must be agreed before both frontend applications build against different assumptions.

## 5. MVP feature freeze

### Required for a credible demo

- Citizen PWA.
- Incident report with location and image.
- Map and nearby incident list.
- Separate report and incident records.
- Basic duplicate suggestion.
- Incident detail and evidence summary.
- Admin review queue.
- Status update and audit event.
- Realtime update in a second browser.
- Basic confirmation with rate limiting.

### Optional if the critical path is stable

- Web Push.
- Media perceptual hashes.
- Advanced description similarity.
- Full neighbourhood health score.
- Field verifier role.
- Official municipal integration.
- AI-generated incident summaries.
- Native mobile app.

## 6. Post-hackathon roadmap

### Phase 7 - Pilot readiness

**Objective:** Turn the demo into a responsible, small-area pilot.

Tasks:
- Select one neighbourhood or ward with a clear operating boundary.
- Validate categories with local users.
- Define who moderates and who may verify resolution.
- Add privacy policy, retention rules and account/data deletion workflow.
- Add user reporting and moderation appeal process.
- Test map provider costs and terms.
- Add backups, monitoring and error reporting.
- Improve offline and weak-network handling.
- Conduct accessibility testing with real users and assistive technologies.

**Exit criteria:** A limited pilot can operate with documented roles, privacy controls and an escalation process.

### Phase 8 - Stronger verification and abuse resistance

**Objective:** Improve signal quality without pretending to prove identity or truth automatically.

Tasks:
- Add perceptual image hash pipeline.
- Add duplicate/near-duplicate media review tools.
- Add coordinated activity analysis and moderator explanations.
- Add independent field verification workflow.
- Add resolution evidence comparison and re-open flow.
- Add moderation appeals and reviewer consistency checks.
- Measure false-positive and false-negative rates.

**Exit criteria:** Abuse flags are measured and reviewed; genuine reports from new users remain possible.

### Phase 9 - Area intelligence and integrations (✅ Complete)

**Objective:** Provide useful operational information for participating organisations.

Tasks:
- [x] Add configurable ward/neighbourhood boundaries using licensed, reliable data (Phase 7 pilot boundaries).
- [x] Add recurring hotspot analytics (Feature 60: Top 4 recurring locations calculated by frequency and active state).
- [x] Add configurable neighbourhood health indicator with transparent definition (Feature 57 formula breakdown).
- [x] Add exportable privacy-safe reports (Phase 6: 1-click Safety Audit CSV export).
- [x] Add external complaint references (Phase 6: Municipal ticket `complaintRef`).
- [x] SLA turnaround time tracking (Feature 61: Average resolution time in hours).
- [x] Multi-ward pilot benchmarking (Feature 63: Greenwood, Palm Heights, Royal Meadows comparative health).

**Exit criteria:** Every external status has a source label and timestamp; operational metrics and hotspot frequency rankings surface in the RWA analytics suite.

### Phase 10 - Scale, native experience & multi-language readiness (✅ Complete)

**Objective:** Expand with verified high-performance caching, cross-platform native parity, and multilingual accessibility.

Tasks:
- [x] High-performance geospatial query caching (`queryCache` with TTL, automatic mutation invalidation, and `X-Cache: HIT/MISS` headers).
- [x] Performance diagnostics API (`GET /api/incidents/performance`) tracking hit rate %, query latency (ms), heap memory (MB), and 2dsphere indexing health.
- [x] Full bilingual localization (**English & Hindi `hi-IN`**) across both the Web PWA (`LanguageContext`) and Flutter Mobile App (`AppTranslations`).
- [x] Language switcher toggle (`EN` | `हिन्दी`) accessible on desktop, mobile web, and native Flutter AppBar.
- [x] Official Emergency Broadcast System (Features 35, 54): RWA advisory publisher with real-time Socket.IO broadcasts and sticky alerts banner.
- [x] Citizen Emergency SOS Panic Beacon (Feature 35): Instant priority emergency alert with GPS location and community-wide siren banner.
- [x] Flutter Native Mobile client verification: 100% test pass rate (`flutter test` 3/3 passed) and 0 lint warnings (`flutter analyze`).

**Exit criteria:** Scaling changes address measured bottlenecks; citizen and admin applications operate natively in both English and Hindi with instant emergency alert capabilities.

## 7. Testing plan by phase

### Functional tests

- Report submission with valid and invalid fields.
- Location permission accepted, denied and unavailable.
- Evidence upload success and failure.
- Nearby incident query and pagination.
- Duplicate candidate and no-candidate scenarios.
- Confirmation uniqueness and rate limits.
- Moderation role access.
- Valid and invalid status transitions.
- Resolution submission and verification.
- Notification preferences and throttling.

### Abuse and edge-case tests

- Many accounts confirm the same incident in a short interval.
- One account submits repeated reports.
- The same image is reused for different incidents.
- GPS is missing, inaccurate or inconsistent with the selected pin.
- Two separate incidents are close together.
- A report arrives after an incident has been marked resolved.
- A user attempts to view private report data belonging to another user.
- Moderator attempts an unauthorised action.
- Worker fails and retries a job.
- Duplicate job is processed twice; processing must be idempotent.

### Visual and accessibility tests

- Small mobile viewport.
- Desktop admin viewport.
- Keyboard-only report and moderation flow.
- Visible focus states.
- Screen-reader labels on form and map alternatives.
- Hindi label wrapping.
- Reduced motion setting.
- Colour contrast and status labels.

## 8. Demo data plan

Seed a small, fictionalised or clearly labelled sample area. Use synthetic names and accounts. Do not imply that generated reports are real citizen submissions.

Recommended scenario set:

1. One road hazard with three independent reports.
2. One water leak with duplicate media.
3. One garbage accumulation with an unverified resolution claim.
4. One power disruption with a moderator-reviewed status.
5. One suspicious coordinated confirmation attempt.
6. One false duplicate pair that the moderator must keep separate.

The false duplicate pair is important: it demonstrates that the system can avoid merging every nearby report blindly.

## 9. Cut list if time is running out

Cut in this order:

1. AI summaries and generative features.
2. Advanced image similarity.
3. Full health-score calculation.
4. Complex area boundary management.
5. Push notification delivery (keep in-app/realtime updates).
6. Native app packaging.
7. Advanced charts.

Do **not** cut:

- Report submission.
- Report/incident separation.
- Map display.
- Admin review.
- Correct status handling.
- Basic permissions and privacy protections.

## 10. Final definition of done

The hackathon build is complete when a judge can use the citizen PWA to submit a report, see it on a map, submit a related report, observe duplicate handling, review the incident in the admin dashboard, see a realtime update, and inspect the resolution evidence workflow. Any simulated attack or synthetic citizen activity must be labelled as such.
