# Product Requirements Document

## Hyperlocal Community Safety Network

**Document version:** 1.0  
**Status:** Hackathon product specification  
**Product type:** Mobile-first web application / Progressive Web App (PWA)  
**Initial deployment context:** One selected neighbourhood or ward in India  
**Working name:** Neighbourhood Network (final product name can be chosen later)

---

## 1. Product summary

The Hyperlocal Community Safety Network helps people report, discover, corroborate and track local incidents that affect their neighbourhood. Examples include road hazards, open manholes, water leaks, drainage problems, garbage accumulation, power disruptions and other locally relevant safety or service issues.

The product is not intended to be another form that simply sends complaints to an authority. Its central function is to turn separate citizen reports into a shared, location-aware incident record. It combines reports, preserves the evidence behind them, helps moderators assess credibility, alerts people who may be affected, and records whether an incident has actually been resolved.

The first release should work without a formal municipal integration or a large resident association. Citizens can submit reports independently. Moderators can review them. An external complaint reference can be recorded when a user or moderator has submitted the issue through an official channel, but the platform must never imply that it has access to an authority's internal systems unless an authorised integration is implemented.

## 2. Problem statement

People in apartments and neighbourhoods do not always have a quick, trusted way to report and verify local incidents such as power cuts, water issues, theft, stray animals and road hazards. Information is often scattered across personal messages, calls, local social groups and separate complaint channels. This makes it difficult for nearby people to know what is happening, whether multiple reports describe the same issue, and whether an issue has actually been resolved.

The source problem statement proposes a mobile-first PWA with live map reporting, upvote-based verification, push alerts and an admin dashboard. It also identifies automatic duplicate clustering and a neighbourhood health score as bonus capabilities.

This PRD retains those core ideas but specifies a more robust implementation: independent reports are grouped under incidents, corroboration is evidence-aware rather than popularity-only, and administrative closure is kept separate from verified physical resolution.

## 3. Product vision

Give every neighbourhood a reliable shared view of local incidents, supported by evidence and transparent status history.

### Product positioning

**A citizen-powered neighbourhood incident intelligence network.**

### Product promise

- Report a local issue with location and evidence.
- See whether others have reported the same issue.
- Understand the confidence and current status of an incident.
- Receive relevant alerts for subscribed areas.
- See what evidence supports a claimed resolution.

## 4. Goals and non-goals

### 4.1 Goals

1. Make it possible to submit a useful local incident report from a mobile phone in under one minute in the common case.
2. Show nearby incidents on a map and in an accessible list.
3. Group duplicate reports into one incident without losing each original report or its evidence.
4. Allow independent corroboration while reducing the influence of coordinated or automated activity.
5. Give moderators a practical queue for reviewing reports, incidents and resolution evidence.
6. Notify relevant users about incidents in their subscribed areas.
7. Maintain a transparent history of incident status changes and moderation actions.
8. Provide basic neighbourhood analytics using clearly defined metrics.
9. Demonstrate the full workflow using a small, clearly labelled demo dataset.

### 4.2 Non-goals for the hackathon MVP

- Replacing police, fire, ambulance or other emergency services.
- Guaranteeing the truth of every citizen-submitted claim.
- Automatically dispatching emergency responders.
- Claiming official municipal, police or government affiliation.
- Integrating with private municipal systems without permission and documented API access.
- Guaranteeing that an authority will act on a report.
- Building a city-wide social network, chat platform or general-purpose messaging service.
- Exposing the identity or exact location of people accused of wrongdoing.
- Using face recognition, public suspect databases or automated guilt determination.
- Building a native Android and iOS application in addition to the PWA for the first release.

## 5. Target users and roles

### 5.1 Citizen / Reporter

A person who notices a local issue and submits a report. Account creation should be lightweight. The product should not require the reporter to return to the application for the incident to remain visible or be reviewed.

### 5.2 Nearby resident / Subscriber

A person who views incidents, confirms that an issue is still present, follows an incident or subscribes to an area/category for alerts.

### 5.3 Moderator

A trusted platform operator who reviews suspicious submissions, merges or separates incident clusters, requests more evidence, and applies moderation decisions.

### 5.4 Area administrator

A person who manages categories, geographical boundaries and moderator assignments for a defined area. This can be the same person as the moderator in the hackathon MVP.

### 5.5 Field verifier (future role)

A person authorised by a participating organisation to inspect an incident and submit independent evidence. This role is optional and not required for the first demo.

### 5.6 Platform administrator

Manages platform-wide configuration, access, audit records and abuse controls.

## 6. Core concepts and terminology

The product must keep these concepts distinct:

- **Report:** One submission from one user, including category, description, time, approximate location and optional evidence.
- **Incident:** The shared real-world issue that may be supported by one or more reports.
- **Confirmation:** A user action indicating that they independently observed the same issue or that it is still present. A confirmation is not automatically proof.
- **Evidence:** A photo, video, note, inspection record or other supporting material attached to a report or resolution claim.
- **Incident confidence:** The platform's current assessment of how well the incident is supported by available evidence.
- **Account risk:** An internal assessment of suspicious account or device behaviour. It must not be displayed as a public accusation.
- **Resolution claim:** A submission that an incident has been fixed or is no longer present.
- **Verified resolution:** A resolution claim supported by the required independent evidence or moderator-approved inspection.

**Important data rule:** One incident can have many reports. Reports must not be deleted just because they are merged into an incident.

## 7. Incident categories

The MVP should begin with a manageable set of categories:

1. Road and public-space hazards: potholes, open manholes, dangerous obstructions, damaged footpaths.
2. Water and drainage: water leakage, blocked drains, waterlogging, sewage overflow.
3. Sanitation: garbage accumulation and overflowing public bins.
4. Utility disruption: local power or water disruption.
5. Public safety concern: a locally relevant hazard that can be safely reported without naming or accusing a private individual.
6. Other: reviewed by a moderator before broad distribution.

Categories should be configurable. Do not make a category public if it creates a high risk of exposing private people or sensitive locations.

## 8. Key user journeys

### 8.1 Submit a report

1. User opens the PWA and selects **Report an issue**.
2. User chooses a category and enters a short description.
3. The application requests location permission and displays the selected location for confirmation. Manual map pin placement is available when GPS is unavailable or inaccurate.
4. User optionally attaches a photograph or short video.
5. The application explains what location and media information will be visible to others.
6. User submits the report.
7. The API validates the request, stores the report and evidence metadata, and attempts to match it to an existing incident.
8. The user receives a report reference and can view the resulting incident, if one was created or matched.

### 8.2 Corroborate an incident

1. User opens an incident detail page.
2. User selects **I have seen this** or **Still happening**.
3. The application asks the user to confirm that they independently observed the issue.
4. The backend checks account limits, repeated actions and suspicious patterns.
5. The confirmation is recorded and incident confidence is recalculated.
6. The interface displays the updated evidence summary without exposing private account-risk details.

### 8.3 Review and moderate an incident

1. Moderator opens the review queue.
2. Moderator sees the incident, linked reports, map area, evidence and system flags.
3. Moderator can confirm, request more evidence, merge, split, restrict visibility, reject a spam report or escalate for a second review.
4. Every action creates an audit event with actor, timestamp and reason.

### 8.4 Submit resolution evidence

1. A citizen, moderator or authorised field verifier submits an after-photo or inspection note.
2. The incident status changes to **Resolution submitted**.
3. Independent confirmation or moderator review is collected.
4. The incident becomes **Resolved - verified** only when the configured verification rule is satisfied.
5. If the issue remains or reappears, a moderator or new report can reopen it.

### 8.5 Receive an area alert

1. User subscribes to a chosen area and incident categories.
2. A qualifying incident is confirmed or reaches an alert threshold.
3. The notification service identifies matching subscriptions and sends a rate-limited notification.
4. The user opens the incident detail page from the notification.

## 9. Functional requirements

Priority definitions: **P0 = required for MVP**, **P1 = valuable if time permits**, **P2 = post-hackathon**.

### 9.1 Citizen application

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-CIT-01 | Register and sign in | P0 | A user can sign in and access their own reports; protected actions require authentication. |
| FR-CIT-02 | Submit an incident report | P0 | User can submit category, description and location; API returns a report reference. |
| FR-CIT-03 | Attach image evidence | P0 | User can upload an allowed image; file type and size are validated. |
| FR-CIT-04 | Capture or select location | P0 | User can use GPS or place a pin manually and review the selected location before submission. |
| FR-CIT-05 | Browse nearby incidents | P0 | Map and list show incidents within the selected map area or radius. |
| FR-CIT-06 | Filter incidents | P1 | User can filter by category and status. |
| FR-CIT-07 | View incident detail | P0 | User can see summary, status, public evidence and timeline without seeing private reporter details. |
| FR-CIT-08 | Confirm an incident | P0 | Authenticated user can submit one active confirmation per incident within configured limits. |
| FR-CIT-09 | Follow or save an incident | P1 | User can follow an incident and view it later. |
| FR-CIT-10 | Subscribe to an area | P1 | User can choose an area and categories for alerts. |
| FR-CIT-11 | View own reports | P0 | User can view their submitted reports and their current status. |
| FR-CIT-12 | Manage notification preferences | P1 | User can opt in/out of supported notification categories. |

### 9.2 Incident intelligence

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-INT-01 | Keep reports and incidents separate | P0 | Multiple reports can reference one incident; each report and its evidence remains accessible to moderators. |
| FR-INT-02 | Suggest duplicate incidents | P0 | New report matching configured time, distance and category conditions is suggested for linking to an existing incident. |
| FR-INT-03 | Moderator-controlled merge/split | P0 | Moderator can merge or separate incident groupings with an audit record. |
| FR-INT-04 | Calculate incident confidence | P0 | Confidence is derived from documented evidence signals, not raw upvote count alone. |
| FR-INT-05 | Detect recurring hotspots | P1 | Analytics can show repeated incidents in a geographical area over a selected period. |
| FR-INT-06 | Identify similar media | P1 | System can flag likely reused images using perceptual hashing; a flag is not an automatic rejection. |
| FR-INT-07 | Analyse description similarity | P2 | System can compare report descriptions to support clustering. |

### 9.3 Trust and abuse prevention

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-TRU-01 | Rate-limit submissions and confirmations | P0 | Repeated requests are throttled by account and additional risk signals. |
| FR-TRU-02 | Flag suspicious activity | P0 | Repeated media, unusual bursts and coordinated confirmations create review flags. |
| FR-TRU-03 | Keep account risk separate from incident confidence | P0 | Internal account-risk flags do not automatically invalidate an otherwise credible incident. |
| FR-TRU-04 | Provide moderator review | P0 | Moderator can inspect flags and record a reasoned decision. |
| FR-TRU-05 | CAPTCHA or bot challenge | P1 | Challenge can be applied to suspicious or high-rate activity. |
| FR-TRU-06 | Appeals / review request | P2 | Users can request review of a moderation restriction. |

### 9.4 Alerts and realtime

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-ALT-01 | Realtime map updates | P0 | Open clients receive incident-created and incident-updated events without a full page refresh. |
| FR-ALT-02 | Nearby push alerts | P1 | Opted-in subscribers receive qualifying alerts; no alert is sent solely because a report is unreviewed. |
| FR-ALT-03 | In-app notification centre | P1 | User can view recent alerts and open the related incident. |
| FR-ALT-04 | Notification throttling | P1 | Repeated updates to one incident do not generate uncontrolled notifications. |

### 9.5 Moderation and resolution

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-MOD-01 | Admin incident overview | P0 | Admin can see counts by status, category and date range. |
| FR-MOD-02 | Review queue | P0 | Admin can review new and flagged reports. |
| FR-MOD-03 | Update incident status | P0 | Allowed state transitions are validated by the API. |
| FR-MOD-04 | Record moderation reasons | P0 | Sensitive actions require a reason and are written to an audit log. |
| FR-MOD-05 | Submit resolution evidence | P0 | Resolution claims can include a photo, note, time and submitter. |
| FR-MOD-06 | Verify resolution | P0 | Only an authorised moderator or configured independent verification rule can mark an incident resolved-verified. |
| FR-MOD-07 | External complaint reference | P1 | Moderator can add an external reference and source label; platform does not claim to fetch its status without an integration. |
| FR-MOD-08 | Manage categories and areas | P1 | Administrator can configure supported categories and geographical areas. |

### 9.6 Analytics

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-ANA-01 | Incident heatmap | P1 | Map can display aggregated incident density for the selected area and period. |
| FR-ANA-02 | Neighbourhood health indicator | P1 | Score uses published metrics and shows its inputs and time window. |
| FR-ANA-03 | Incident and resolution trends | P1 | Admin can view category counts, open incidents and resolution outcomes over time. |
| FR-ANA-04 | Export summary | P2 | Admin can export filtered, privacy-safe summary data. |

## 10. Incident status model

Recommended MVP statuses:

1. **Reported:** A report has been submitted and has not yet been reviewed.
2. **Under review:** The incident or report is being checked.
3. **Confirmed:** Available evidence supports the incident.
4. **Action pending:** The incident is confirmed and follow-up is expected or underway.
5. **Resolution submitted:** Someone has claimed the issue is fixed and supplied evidence.
6. **Resolved - verified:** The configured independent verification requirement has been met.
7. **Closed - unverified:** The platform has closed the record administratively but cannot verify the physical outcome. This status must be clearly distinguished from verified resolution.
8. **Rejected / spam:** A moderator has determined that the report should not remain as a valid public incident.
9. **Reopened:** New evidence indicates that the issue persists or has returned.

A report's moderation status and its linked incident's lifecycle status should be stored separately where needed. A report being rejected must not silently delete other valid reports linked to the same incident.

## 11. Trust model and safety rules

### 11.1 Three independent assessments

- **Incident confidence:** How strongly the incident is supported by independent reports and evidence.
- **Account risk:** Whether an account's activity exhibits suspicious patterns.
- **Resolution confidence:** How strongly evidence supports the claim that the issue is fixed.

These must not be collapsed into one score.

### 11.2 MVP confidence signals

Use a transparent, rule-based approach first:

- Independent reports from distinct accounts.
- Evidence availability and quality.
- Location and timestamp consistency.
- Category and description consistency.
- Duplicate-media flags.
- Moderator assessment.

The UI should use understandable labels such as **Limited evidence**, **Corroborated** and **Moderator reviewed**. Avoid presenting a percentage as scientific certainty unless a validated model supports it.

### 11.3 Abuse response

- Rate-limit rather than immediately ban on a single weak signal.
- Keep urgent safety reports available for human review even when the account appears suspicious.
- Do not let account count or upvote count alone trigger high-impact public alerts.
- Use manual review and an appeal path for consequential restrictions.
- Treat IP address, phone number and device signals as imperfect indicators, not definitive identity proof.

## 12. Privacy, security and responsible use

1. Ask for location permission only when needed and explain why it is requested.
2. Show the user what location precision will be visible publicly.
3. Store precise coordinates for legitimate operational needs, but expose a coarser or privacy-safe public location for sensitive reports.
4. Never publish a reporter's phone number, email, device signals or private account-risk flags.
5. Do not encourage allegations against named individuals. Remove or restrict identifying accusations and route them to appropriate channels where necessary.
6. Validate and safely process uploaded files; restrict file size and accepted MIME types, and avoid serving untrusted uploads as executable content.
7. Use HTTPS, secure session handling, role-based access and server-side authorisation.
8. Keep an audit trail for moderator and administrator actions.
9. Provide account deletion and data-retention rules before a public pilot.
10. Display a clear notice that this is an independent community platform, not an emergency service or official government portal.
11. For immediate danger, instruct users to contact the appropriate emergency service rather than waiting for an app response.
12. Do not expose exact locations of shelters, vulnerable people or other sensitive facilities.

## 13. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Common map and feed API requests should target a p95 response time under 800 ms in the demo environment, excluding external map tile loading. |
| Reliability | Failed background jobs must be retryable and visible to operators. |
| Realtime | Connected clients should receive ordinary incident updates within a few seconds under demo load. |
| Accessibility | Core reporting and browsing flows should support keyboard navigation, visible focus, labels, sufficient contrast and screen-reader-friendly names. |
| Responsiveness | Citizen experience must work on small mobile screens first; admin dashboard should be usable on desktop and tablet. |
| Security | Every protected API route must enforce authentication and role permissions on the server. |
| Observability | API errors, worker failures and key moderation actions must be logged with request or correlation IDs. |
| Maintainability | Use typed shared contracts, documented APIs and modular backend domains. |
| Data integrity | Reports, incidents, evidence and status events must retain referential integrity and timestamps. |
| Localisation | Design for English and Hindi labels; additional languages can follow. |

## 14. Success metrics

### Hackathon demo metrics

- A user can submit a report with location and image successfully.
- A second report about the same incident is linked to the same incident or presented as a duplicate suggestion.
- A moderator can review and change status with an audit entry.
- A connected map client receives the new incident without refreshing.
- Suspicious simulated activity is flagged without automatically suppressing a genuine report.
- A resolution claim remains unverified until the configured evidence review is complete.

### Pilot metrics to collect later

- Median time to submit a report.
- Percentage of reports with usable location and evidence.
- Duplicate-link precision and moderator correction rate.
- Time from first report to first corroboration.
- Percentage of incidents with a reviewed outcome.
- Percentage of resolution claims independently verified.
- False-positive and false-negative rates for abuse flags.
- Notification opt-in rate and alert usefulness feedback.

Do not claim social impact such as hazards prevented or municipal response improvements without measured pilot data.

## 15. MVP boundaries

### Must demonstrate

- Citizen PWA with authentication.
- Report form with location and image.
- Map and nearby incident list.
- Report-to-incident relationship.
- Simple duplicate suggestion based on category, time and geospatial distance.
- Confirmation action with basic rate limiting.
- Admin review and status workflow.
- Realtime map update.
- Basic audit history.
- Seeded demo scenarios labelled as simulated.

### If time permits

- Web push notifications.
- Image perceptual hashing.
- Incident heatmap.
- Transparent neighbourhood health indicator.
- Attack simulation panel.
- Resolution before/after comparison.

### Post-hackathon

- Field verification workflow.
- Official complaint reference integrations where authorised.
- More advanced media and text similarity.
- Multi-ward administration.
- Formal moderation appeals and retention controls.
- Native mobile applications if validated by usage.

## 16. Hackathon demo narrative

A five-minute demo should tell one connected story:

1. A citizen reports a pothole with a photo and pin.
2. A second citizen reports the same pothole from nearby; the system suggests merging the reports under one incident.
3. A third user independently confirms that it is still present.
4. The admin dashboard displays the incident, its reports, evidence and current confidence label.
5. The system sends or previews a relevant alert to a subscribed test user.
6. The attack simulation generates suspicious coordinated confirmations; the system flags them for review rather than treating them as proof.
7. An after-photo is submitted. The incident stays **Resolution submitted** until a moderator verifies the evidence.

All simulated accounts, reports and events must be labelled as simulated in the demo.

## 17. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Few citizens participate | Keep browsing useful, allow lightweight reporting, use optional subscriptions and support moderator/field evidence. Do not depend on every reporter returning. |
| Fake accounts manipulate confirmations | Rate limits, independent-account checks, media reuse checks, behaviour analysis and human review. |
| GPS is inaccurate or spoofed | Allow manual pin correction; treat GPS as a signal, not proof. |
| Duplicate detection merges different incidents | Start with conservative matching and moderator-controlled merge/split. |
| Public accusation or privacy harm | Restrict sensitive categories, redact personal details and use privacy-safe map precision. |
| Users mistake platform for an official service | Clear independent-platform branding and disclaimer. |
| Notification fatigue | Area/category subscriptions, severity thresholds and throttling. |
| False resolution | Separate resolution-submitted, closed-unverified and resolved-verified statuses. |
| Scope becomes too large | Prioritise the end-to-end incident journey before advanced analytics and ML. |

## 18. Open decisions before a real pilot

- Which neighbourhood or ward will be the first deployment area?
- Which categories are safe and useful to make public?
- Who is authorised to moderate reports and verify resolutions?
- What retention period applies to precise location and uploaded media?
- Which map tile provider and usage plan will be used in production?
- Will official complaint references be manually recorded or integrated through an authorised API?
- What local-language content and support are required?

## 19. Definition of done for MVP

The MVP is ready for judging when a complete report-to-resolution workflow works end to end, the admin can moderate it, the live map reflects updates, duplicate reports are handled without losing source evidence, and the system communicates uncertainty honestly. A polished dashboard without this working workflow does not satisfy the product requirement.
