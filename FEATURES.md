# Hyperlocal Community Safety Network

## Complete Feature Catalogue

This document is the consolidated feature reference for the Hyperlocal Community Safety Network. Keep it alongside `PRD.md`, `ARCHITECTURE.md`, `THEME.md`, and `PHASES.md`.

The catalogue contains all 70 proposed features, grouped by application area. Feature numbers are stable identifiers and are used in the MVP priority section at the end of this document.

---

## 1. Citizen Application

| ID | Feature | Description |
|---:|---|---|
| 01 | User Registration & Login | Secure sign-up using phone OTP, email or social login. |
| 02 | Incident Reporting | Report road hazards, theft, water problems, power cuts, garbage and other local incidents. |
| 03 | GPS Location Detection | Automatically capture the incident's geographical location. |
| 04 | Photo & Video Upload | Attach visual evidence to incident reports. |
| 05 | Live Incident Map | View nearby incidents on an interactive map. |
| 06 | Nearby Incident Feed | Browse incidents around the user's current or selected location. |
| 07 | Incident Search & Filters | Filter by category, distance, severity and status. |
| 08 | Incident Details | View descriptions, photographs, timestamps, location and verification history. |
| 09 | Upvote & Confirmation | Confirm whether an incident exists or is still active. |
| 10 | Comments & Updates | Share relevant information about an incident. |
| 11 | Save Incidents | Bookmark important incidents for later. |
| 12 | My Reports | Track incidents submitted by the user. |
| 13 | Area Subscription | Subscribe to specific neighbourhoods or geographical areas. |
| 14 | User Profile | Manage personal details, preferences and notification settings. |

## 2. Incident Intelligence Engine

| ID | Feature | Description |
|---:|---|---|
| 15 | Automatic Duplicate Detection | Identify multiple reports describing the same incident. |
| 16 | Incident Clustering | Combine related reports into one incident while preserving individual evidence. |
| 17 | Geospatial Analysis | Identify incidents based on geographical proximity. |
| 18 | Incident Severity Classification | Categorise incidents by their potential impact. |
| 19 | Incident Confidence Score | Estimate confidence using independent reports and available evidence. |
| 20 | Image Similarity Detection | Identify repeated or similar photographs. |
| 21 | Description Similarity Detection | Identify reports describing the same underlying problem. |
| 22 | Recurring Incident Detection | Identify locations experiencing repeated problems. |
| 23 | Incident Timeline | Maintain a chronological history of reports, confirmations and status changes. |

## 3. Trust & Security Engine

| ID | Feature | Description |
|---:|---|---|
| 24 | Fake Report Detection | Flag suspicious or potentially misleading reports. |
| 25 | Sybil Account Detection | Identify suspicious groups of accounts potentially controlled by the same person. |
| 26 | Coordinated Upvote Detection | Detect unusual patterns of mass confirmations. |
| 27 | Account Risk Assessment | Analyse suspicious user behaviour. |
| 28 | GPS Consistency Checks | Flag questionable location and timestamp combinations. |
| 29 | Media Reuse Detection | Detect previously uploaded images being reused as new evidence. |
| 30 | Rate Limiting | Prevent excessive reporting and confirmation attempts. |
| 31 | CAPTCHA & Bot Protection | Reduce automated spam submissions. |
| 32 | Manual Moderation | Allow moderators to investigate suspicious activity. |
| 33 | Audit Logs | Maintain records of important administrative and verification actions. |

## 4. Notifications & Alerts

| ID | Feature | Description |
|---:|---|---|
| 34 | Nearby Push Notifications | Notify users about relevant incidents in their subscribed areas. |
| 35 | High-Severity Alerts | Prioritise important incidents. |
| 36 | Category-Based Notifications | Allow users to choose which types of incidents they receive. |
| 37 | Incident Status Notifications | Notify users when incidents change status. |
| 38 | Resolution Notifications | Inform subscribers when resolution evidence is submitted. |
| 39 | Custom Alert Radius | Let users configure their preferred notification distance. |

## 5. Resolution & Verification

| ID | Feature | Description |
|---:|---|---|
| 40 | Incident Status Tracking | Track reported, under review, confirmed, action pending and resolved incidents. |
| 41 | Before & After Evidence | Compare incident photographs before and after claimed resolution. |
| 42 | Resolution Verification | Record independent confirmation or field inspection evidence. |
| 43 | Official Complaint Reference | Attach an external municipal complaint reference where available. |
| 44 | Unverified Resolution Warning | Distinguish administrative closure from independently verified resolution. |
| 45 | Incident Reopening | Reopen an incident when the underlying problem returns. |

## 6. Admin & Moderation Dashboard

| ID | Feature | Description |
|---:|---|---|
| 46 | Operations Dashboard | View total, active, confirmed and resolved incidents. |
| 47 | Live Incident Monitoring | Monitor new reports as they arrive. |
| 48 | Incident Management | Review, update, merge, assign and manage incidents. |
| 49 | Evidence Review Panel | Inspect submitted photographs, videos and confirmations. |
| 50 | Moderation Queue | Review suspicious reports and accounts. |
| 51 | User Management | Manage users, roles and restrictions. |
| 52 | Area Management | Configure geographical areas and administrative boundaries. |
| 53 | Resolution Management | Review and record resolution evidence. |
| 54 | Notification Management | Send relevant area-specific announcements. |
| 55 | Administrative Audit History | Review moderator and administrator actions. |

## 7. Analytics & Neighbourhood Intelligence

| ID | Feature | Description |
|---:|---|---|
| 56 | Incident Heatmap | Visualise geographical concentrations of incidents. |
| 57 | Neighbourhood Health Score | Calculate an area-level indicator using transparent incident metrics. |
| 58 | Incident Trend Analysis | Track incident frequency over time. |
| 59 | Category Analytics | Analyse the distribution of incident categories. |
| 60 | Incident Hotspot Detection | Identify locations with recurring problems. |
| 61 | Response Time Analytics | Measure time between reporting, acknowledgement and resolution. |
| 62 | Resolution Rate Analytics | Track the percentage of incidents with verified resolutions. |
| 63 | Area Comparison | Compare incident patterns across neighbourhoods. |
| 64 | Data Export | Export reports and statistics for analysis. |

## 8. Advanced Demo Features

| ID | Feature | Description |
|---:|---|---|
| 65 | Attack Simulation Lab | Simulate fake accounts, duplicate reports and coordinated confirmations. |
| 66 | Incident Replay | Replay how reports arrived, merged and changed status over time. |
| 67 | Live Map Animation | Show incidents appearing and updating in real time. |
| 68 | Real-Time Analytics | Update dashboard charts when incidents change. |
| 69 | Geographical Impact Visualisation | Highlight the area affected by an incident. |
| 70 | Demo Data Generator | Generate clearly labelled simulated incidents for testing and presentations. |

---

# Implementation Priorities

The full catalogue is the product feature reference. It is not a requirement to implement all 70 features in the first release. Use the following priorities to control scope.

## Must Build: MVP

These features form the minimum usable end-to-end product.

**Feature IDs:** `01, 02, 03, 04, 05, 08, 09, 15, 16, 19, 34, 40, 46, 48`

| ID | Feature |
|---:|---|
| 01 | User Registration & Login |
| 02 | Incident Reporting |
| 03 | GPS Location Detection |
| 04 | Photo & Video Upload |
| 05 | Live Incident Map |
| 08 | Incident Details |
| 09 | Upvote & Confirmation |
| 15 | Automatic Duplicate Detection |
| 16 | Incident Clustering |
| 19 | Incident Confidence Score |
| 34 | Nearby Push Notifications |
| 40 | Incident Status Tracking |
| 46 | Operations Dashboard |
| 48 | Incident Management |

## Differentiators

These features provide meaningful technical depth and help distinguish the product from a basic reporting application.

**Feature IDs:** `20, 25, 26, 32, 41, 42, 56, 57`

| ID | Feature |
|---:|---|
| 20 | Image Similarity Detection |
| 25 | Sybil Account Detection |
| 26 | Coordinated Upvote Detection |
| 32 | Manual Moderation |
| 41 | Before & After Evidence |
| 42 | Resolution Verification |
| 56 | Incident Heatmap |
| 57 | Neighbourhood Health Score |

## Demo Showcase

These features are intended to make the working system easier to demonstrate to judges. Simulated activity must be visibly labelled as simulation.

**Feature IDs:** `65, 66, 67, 68, 70`

| ID | Feature |
|---:|---|
| 65 | Attack Simulation Lab |
| 66 | Incident Replay |
| 67 | Live Map Animation |
| 68 | Real-Time Analytics |
| 70 | Demo Data Generator |

---

# Product and Implementation Notes

1. Keep **Reports** and **Incidents** as separate concepts: multiple citizen reports can provide evidence for one incident, while each report retains its own author, timestamp and media.
2. Do not treat an upvote count as proof. Confirmation activity is one signal among several, and coordinated or suspicious activity should be reviewable.
3. Keep **incident confidence**, **account risk** and **resolution confidence** conceptually separate. They answer different questions and should not be collapsed into one score.
4. Do not mark an incident physically resolved solely because an administrator changes its status. Preserve the distinction between administrative closure and independently verified resolution.
5. Use the attack simulation and generated demo records only as clearly labelled test data. Do not present simulated incidents, accounts or detection results as live community activity.
6. Treat precise location, photographs, videos and personal information as sensitive. Public map views should not expose reporter identities or sensitive exact locations unnecessarily.
7. Official complaint references and status updates are optional integrations or manually entered references where available. Do not imply a live municipal-system integration unless one has actually been implemented and authorised.

---

## Related Project Documents

- `PRD.md` — product requirements and user journeys.
- `ARCHITECTURE.md` — application architecture, services, data and interfaces.
- `THEME.md` — visual identity and interface design guidance.
- `PHASES.md` — implementation phases and delivery plan.
- `README.md` — project documentation index.
