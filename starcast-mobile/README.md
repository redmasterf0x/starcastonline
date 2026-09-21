# StarCast Mobile (Android & Cross-Platform)

Official consumer mobile app for **StarCast Online** (StarCast Media).

- **Package Name (Application ID):** `online.starcast.app`
- **Target OS:** Android (Google Play Store) & iOS
- **Design System:** StarCast 2026 Dark Cosmic Broadcast Theme (`#05051F`, `#EA6F2A`, `#22B573`, `#20EFE0`, `#FFD166`)

---

## 📱 App Scope & Features

1. **Gatekeeping Authentication (First-Time Launch):**
   - Google Sign-In & Phone Number OTP authentication matching the StarCast network.
   - Guest exploration mode.
2. **Watch Broadcasts:**
   - Original StarCast series: *The Observation Deck*, *Hollywood After Babylon*, *Star Talk*, and *The Psyco G Spot*.
   - Direct episode streaming and YouTube playlist integration.
3. **Articles & Dispatches:**
   - **Top Story Spotlight** hero card directly at the top.
   - Secondary editorial dispatches, tag filtering, and rich distraction-free reader mode.
4. **The DECK Community:**
   - Live forum feed, community comments, and topic creation modal.
5. **Profile & Account Management:**
   - User profile details and StarCast pass tier.
   - **Switch Account / Sign Out** flow that clears the session and routes straight to the clean Sign In screen.

---

## 🚀 Development & Build

### Running Locally:
```bash
cd starcast-mobile
flutter pub get
flutter run
```

### Building for Google Play Store (.aab):
```bash
flutter build appbundle --release
```
Output: `build/app/outputs/bundle/release/app-release.aab`
