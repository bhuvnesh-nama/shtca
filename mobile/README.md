# HyperNet Mobile Application (Flutter)

A cross-platform Flutter mobile client for the **Hyperlocal Community Safety Network**, directly addressing the Hackathon Problem Statement ("1.1 Hyperlocal Community Safety Network").

## Features

- **Live Community Safety Feed:** View active local hazards (power cuts, water issues, theft, stray animals, road hazards, sanitation) with status badges and severity levels.
- **Neighbourhood Health Score (Bonus Twist 2):** Real-time health index indicator reflecting open vs resolved hazards, category distribution, and safety grade.
- **Report Hazard with Auto-Clustering (Bonus Twist 1):** Submitting nearby hazards in the same category automatically detects and corroborates existing clusters, eliminating duplicate spam.
- **Upvote & Community Verification:** 1-tap resident verification with live counter and auto-advancement to "Community Confirmed" at 3+ upvotes.
- **Hackathon Demo Simulation Lab:** In-app triggers to simulate duplicate cluster corroboration, community upvote surges, RWA resolution actions, and environment resets on demand.
- **RWA Operations Queue:** Admin view to update lifecycle statuses and record resolution notes.

## How to Run

### 1. Prerequisites
Ensure the backend server is running:
```powershell
# From project root
cd backend
node dist/index.js # Runs on port 8000
```

### 2. Run on Android Emulator
```powershell
cd mobile
flutter run
```
*Note: The app automatically detects Android and connects to `http://10.0.2.2:8000/api` to reach the local host server.*

### 3. Run on Windows Desktop
```powershell
cd mobile
flutter run -d windows
```

### 4. Run on Chrome (Web)
```powershell
cd mobile
flutter run -d chrome
```
