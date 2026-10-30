# Visual Theme and UI Guidelines

## Hyperlocal Community Safety Network

**Design direction:** Professional public-service portal  
**Style:** Clear, trustworthy, restrained, accessible and information-first  
**Applies to:** Citizen PWA, admin dashboard, maps, forms, notifications and reports

---

## 1. Design intent

The product should feel like a dependable public-service information portal, not a flashy social network or a generic AI-generated SaaS dashboard.

The visual language should communicate:

- Trust and clarity.
- Public usefulness and accountability.
- Calm handling of potentially stressful incidents.
- Clear separation between verified information, reports awaiting review and unverified claims.
- Accessibility for users with different devices, abilities and language preferences.

### Government-style, without impersonation

Use the visual discipline of a professional government portal: strong navigation hierarchy, plain language, restrained colours, visible service information and accessible forms.

Do **not** use a national/state emblem, Ashoka emblem, official government seal, department logo or copied government identity. Do not describe the product as an official government service. Include a visible statement such as:

> An independent community information platform. Not an emergency service or official government portal.

## 2. Brand personality

| Attribute | Direction |
|---|---|
| Trustworthy | Consistent layout, clear labels and visible evidence. |
| Neutral | Avoid sensational colours and alarmist language. |
| Practical | Prioritise maps, reports, status and actions. |
| Inclusive | Plain English, Hindi-ready text and accessible controls. |
| Accountable | Show timestamps, status history and evidence source. |

Avoid: neon gradients, glassmorphism, excessive blur, giant decorative illustrations, oversized rounded cards, unnecessary animations and AI-themed visual clichés.

## 3. Colour system

Use a restrained navy/blue and neutral base. Reserve strong colours for meaningful statuses and alerts.

### 3.1 Core palette

| Token | Hex | Use |
|---|---|---|
| `--color-navy-950` | `#102A43` | Main header, strong text on selected dark surfaces |
| `--color-navy-900` | `#163A5F` | Primary navigation and headings |
| `--color-blue-700` | `#175CD3` | Primary actions and active links |
| `--color-blue-100` | `#D1E9FF` | Selected filters and subtle information surfaces |
| `--color-page` | `#F4F6F8` | Main application background |
| `--color-surface` | `#FFFFFF` | Cards, panels and forms |
| `--color-border` | `#D0D5DD` | Dividers, input borders and card outlines |
| `--color-text` | `#1D2939` | Main text |
| `--color-muted` | `#667085` | Supporting text |
| `--color-green-700` | `#067647` | Verified/resolved state |
| `--color-green-100` | `#D1FADF` | Subtle success surface |
| `--color-amber-700` | `#B54708` | Pending review / caution |
| `--color-amber-100` | `#FEF0C7` | Caution surface |
| `--color-red-700` | `#B42318` | High severity / destructive action |
| `--color-red-100` | `#FEE4E2` | Error / critical alert surface |
| `--color-purple-700` | `#6941C6` | Optional system-generated or analysis label |

Use any saffron or green accent sparingly. Do not turn the entire interface into a flag-colour theme.

### 3.2 Status colours

Colour must always be accompanied by a text label and, where helpful, an icon.

| Status | Colour | Visible label |
|---|---|---|
| Reported | Neutral grey | Reported |
| Under review | Amber | Under review |
| Confirmed | Blue | Confirmed |
| Action pending | Navy/blue | Action pending |
| Resolution submitted | Purple | Resolution submitted |
| Resolved - verified | Green | Resolved - verified |
| Closed - unverified | Grey | Closed - unverified |
| Rejected / spam | Red | Rejected |
| Reopened | Amber | Reopened |

Do not use green for an incident that has only been administratively closed without physical verification.

## 4. Typography

### Font family

- English: `Noto Sans` or `Inter`.
- Hindi/Devanagari: `Noto Sans Devanagari`.
- Use a system sans-serif fallback for performance.

Suggested CSS:

```css
:root {
  --font-sans: "Noto Sans", "Noto Sans Devanagari", Inter, system-ui, sans-serif;
}
```

### Type scale

| Token | Size | Weight | Use |
|---|---:|---:|---|
| Display | 32 px | 700 | Rare page-level hero heading |
| H1 | 28 px | 700 | Main page title |
| H2 | 22 px | 650 | Major section title |
| H3 | 18 px | 600 | Card/panel title |
| Body | 15-16 px | 400 | Main content |
| Small | 13-14 px | 400 | Metadata and supporting text |
| Label | 13-14 px | 600 | Form labels and table headings |

Do not use tiny text for incident status, location or critical information.

## 5. Layout and spacing

- Use a 4 px base spacing unit and an 8 px common rhythm.
- Main desktop content max-width: approximately 1440 px.
- Desktop page gutters: 24-32 px.
- Mobile page gutters: 16 px.
- Panel/card padding: 16-24 px.
- Use 8-12 px corner radii for panels and controls.
- Use subtle borders rather than heavy shadows.
- Keep important map/list controls visible without covering map content.

Suggested breakpoints:

- Mobile: under 640 px.
- Tablet: 640-1023 px.
- Desktop: 1024 px and above.

## 6. Navigation structure

### 6.1 Citizen PWA

**Desktop navigation:**

- Brand and service name.
- Explore map.
- Nearby incidents.
- Report an issue (primary action).
- My reports.
- Alerts.
- Language selector.
- Profile menu.

**Mobile navigation:**

Use a compact top bar and a simple bottom navigation:

- Home.
- Map.
- Report (prominent central action).
- Alerts.
- Profile.

Do not hide the report action behind multiple menus.

### 6.2 Admin dashboard

Use a left sidebar and a compact top bar.

Sidebar sections:

1. Overview.
2. Live map.
3. Incidents.
4. Review queue.
5. Evidence and resolution.
6. Suspicious activity.
7. Analytics.
8. Users and roles.
9. Areas and categories.
10. Audit log.

Show role and active area in the header. Keep the review queue count visible where appropriate.

## 7. Page-level design guidance

### 7.1 Citizen home

- Clear service heading and independent-platform disclaimer.
- Prominent **Report an issue** button.
- Nearby incidents list with category, distance, status and last update.
- Small map preview or map-first layout depending on screen size.
- Search/select area control.
- No giant marketing hero on the operational home screen.

### 7.2 Incident map

- Map occupies the main content area.
- Use accessible marker shapes and colours by category/severity.
- Provide a corresponding list view for users who cannot easily interpret the map.
- Cluster dense markers at lower zoom levels.
- Filters should be visible and easy to clear.
- A marker click opens a concise preview; a second action opens full details.
- Include a map attribution area required by the selected provider.

### 7.3 Report form

Recommended steps:

1. Incident category.
2. Short description.
3. Location pin and accuracy note.
4. Optional photograph/video.
5. Visibility and safety notice.
6. Review and submit.

Design rules:

- One clear primary button per step.
- Show required vs optional fields.
- Explain location permission before requesting it.
- Preserve entered text if upload fails.
- Show upload progress and retry state.
- Warn users not to include faces, vehicle registration numbers or private details unless necessary and safe.

### 7.4 Incident detail

Display in this order:

1. Category, title and status.
2. Location at privacy-safe precision.
3. First reported and last updated timestamps.
4. Incident confidence label and a short explanation.
5. Evidence gallery with source and time labels.
6. Confirmation action.
7. Incident timeline.
8. Resolution evidence, if any.
9. Report correction or safety feedback action.

Never show private account-risk scores or personal contact details.

### 7.5 Admin overview

- KPI strip: open incidents, under review, resolution submitted, resolved verified.
- Main live map.
- Review queue panel.
- Recent activity timeline.
- Category and area summary.
- Clear date range and data freshness labels.

Avoid decorative chart clutter. Every chart should answer an operational question.

### 7.6 Review queue

Use a dense but readable table/list with:

- Incident reference.
- Category and approximate area.
- Number of linked reports.
- Evidence count.
- Confidence label.
- Reason for review flag.
- Age of oldest report.
- Current status.
- Review action.

Show why an item was flagged. Do not show a bare risk number without explanation.

## 8. Components to build

### Shared components

- `AppHeader`
- `ServiceDisclaimer`
- `PrimaryNavigation`
- `PageTitle`
- `StatusBadge`
- `SeverityIndicator`
- `CategoryIcon`
- `IncidentCard`
- `IncidentList`
- `IncidentMap`
- `MapLegend`
- `FilterBar`
- `LocationPicker`
- `EvidenceUploader`
- `EvidenceGallery`
- `IncidentTimeline`
- `ConfidencePanel`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `ConfirmDialog`
- `Toast`
- `DataTable`
- `MetricCard`

### Form components

- Labelled text input and textarea.
- Select with searchable categories if needed.
- File upload with preview and remove action.
- Location permission explanation.
- Manual map pin selector.
- Checkbox and consent text.
- Inline validation messages.

## 9. Map visual language

### Marker design

Use category icon and shape, with colour as a secondary cue. The map must remain understandable to colour-blind users.

Suggested category symbols:

- Road hazard: road/cone icon.
- Water/drainage: droplet icon.
- Sanitation: trash icon.
- Utility disruption: zap icon.
- Public safety hazard: shield-alert icon.

### Marker states

- Normal: small category marker.
- Selected: outlined or enlarged marker with focus indicator.
- Cluster: count marker with neutral background.
- Sensitive: approximate location marker or area polygon instead of an exact point.

### Heatmap

- Include legend and selected time window.
- Explain that heatmap intensity represents reported incidents, not necessarily verified danger.
- Allow the user to switch back to individual incidents.

## 10. Motion and interaction

Use motion only to communicate state changes:

- New incident marker fades in or is briefly highlighted.
- Status change has a subtle transition.
- Upload progress is explicit.
- Toast confirms successful submission.
- Avoid pulsing every marker or continuously animating the map.
- Respect `prefers-reduced-motion`.

## 11. Accessibility requirements

- Meet WCAG 2.2 AA as a design target; do not claim compliance without testing.
- Provide visible keyboard focus states.
- All inputs have persistent labels, not placeholder-only labels.
- Dialogs manage focus and support Escape where appropriate.
- Colour is never the only status indicator.
- Images have meaningful alt text where useful; decorative images use empty alt text.
- Controls have accessible names and adequate touch target sizes.
- Ensure map information is available through a list alternative.
- Support browser zoom and text resizing.
- Check English and Hindi text wrapping and line height.
- Avoid relying on hover-only interactions.

## 12. Language and content style

Use plain, respectful, non-accusatory language.

Preferred examples:

- “Report an issue” rather than “Raise a civic ticket”.
- “I have seen this” rather than “Upvote”.
- “Evidence is limited” rather than “Fake report”.
- “Resolution submitted” rather than “Fixed” until verification is complete.
- “Approximate location shown for privacy” where location has been blurred.

Support English and Hindi-ready layouts. Keep text keys externalised so additional languages can be added later.

## 13. Data visualisation rules

Every metric card or chart must include:

- Metric definition.
- Time period.
- Area scope.
- Data freshness timestamp.
- Whether the values include unverified reports.

For example, do not label a chart **Neighbourhood safety score** without describing how it is calculated. Prefer **Neighbourhood issue indicator** or **Area status summary** if the score is only a simple composite of incident counts and resolution metrics.

## 14. Responsive behaviour

| Element | Mobile | Desktop |
|---|---|---|
| Navigation | Bottom nav + compact header | Full header or admin sidebar |
| Map | Fullscreen or map/list toggle | Map with side incident list |
| Report form | Single column, step-by-step | Narrow centred form |
| Incident detail | Stacked sections | Main content + side status panel |
| Admin tables | Card rows / horizontally safe layout | Full data table |
| Analytics | Stacked charts | Multi-column dashboard |

## 15. Suggested design tokens

```css
:root {
  --color-navy-950: #102A43;
  --color-navy-900: #163A5F;
  --color-primary: #175CD3;
  --color-primary-hover: #1849A9;
  --color-page: #F4F6F8;
  --color-surface: #FFFFFF;
  --color-border: #D0D5DD;
  --color-text: #1D2939;
  --color-muted: #667085;
  --color-success: #067647;
  --color-warning: #B54708;
  --color-danger: #B42318;
  --radius-card: 10px;
  --radius-control: 8px;
  --shadow-panel: 0 1px 3px rgb(16 24 40 / 8%);
  --font-sans: "Noto Sans", "Noto Sans Devanagari", Inter, system-ui, sans-serif;
}
```

## 16. Visual quality checklist

Before demo:

- Citizen and admin applications use the same colour, typography and status rules.
- There is no fake government logo or claim of official status.
- Map markers have a legend and a list alternative.
- Important data is not hidden in hover interactions.
- All status labels are understandable without colour.
- Every chart has a title, time window and data scope.
- Empty, loading, failed and offline states are designed.
- The mobile report flow is usable with one hand on a small screen.
- Hindi labels do not overflow or clip.
- Simulated data is clearly labelled in demo mode.
