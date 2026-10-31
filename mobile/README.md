# SHTCA Mobile Application (Flutter)

A cross-platform Flutter mobile client for the **SHTCA (Smart Hyperlocal Town & Civic Authority)** platform.

## Features

- **Live Civic Grievance Feed:** View active local hazards (power cuts, water issues, theft, stray animals, road hazards, sanitation) with status badges and severity levels.
- **Civic Health & Redressal Index:** Real-time health index indicator reflecting open vs resolved hazards, category distribution, and municipal performance grade.
- **GPS-Based Auto-Routing:** Submitting nearby grievances dynamically resolves and routes tickets to the nearest municipal desk, eliminating manual zone confusion.
- **Citizen Corroboration:** 1-tap resident verification with live counter and auto-advancement to "Community Confirmed" status.
- **Interactive Civic Map:** Visualizes geotagged grievances on an OpenStreetMap tile canvas with color-coded severity markers.
- **Emergency Civic Broadcasts:** Real-time civil emergency advisories for public utility alerts and weather warnings.

## How to Run

### 1. Prerequisites
Ensure the backend server is running:
```powershell
cd backend
npm run dev # Runs on port 8000
```

### 2. Run on Android Device / Emulator
```powershell
cd mobile
flutter run
```

### 3. Build Release APK
```powershell
cd mobile
flutter build apk --release
```
The optimized installable `.apk` will be output to:
`build/app/outputs/flutter-apk/app-release.apk`
