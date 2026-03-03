# Boober Play Store Preparation Report

**Generated:** 2026-02-24 03:35 UTC  
**Agent:** Play Store Prep Agent  
**Status:** In Progress

---

## Executive Summary

Boober is **NOT READY** for Google Play Store submission. Critical blockers must be resolved before launch.

| Category | Status | Priority |
|----------|--------|----------|
| App Icons | ✅ Complete | Done |
| Feature Graphic | ✅ Complete | Done |
| Screenshots | ❌ Missing | Critical |
| Privacy Policy | ✅ Complete | Done |
| Store Description | ✅ Complete | Done |
| App Bundle (AAB) | ❌ Missing | Critical |
| App Signing | ⚠️ Pending | High |
| Content Rating | ⚠️ Pending | High |

---

## 1. App Icons - ✅ COMPLETE

**Files Verified:**
- `store-assets/icon-512.png` - 512x512 PNG ✅
- `store-assets/app-icon-512.png` - 512x512 PNG ✅
- `store-assets/feature-graphic-1024x500.png` - 1024x500 PNG ✅

**Google Play Requirements:**
- [x] 512x512 (high-res icon)
- [x] 1024x500 (feature graphic)

**Note:** All required icon sizes are present and correctly sized.

---

## 2. Phone Screenshots - ❌ MISSING

**Required:** 3-8 screenshots  
**Current:** 0 screenshots

The `store-assets/phone-screenshots/` folder is empty (only contains README.md).

### Recommended Screenshots:

1. **onboarding-screen.png** - Welcome/role selection (Passenger/Driver/Marshal)
2. **home-dashboard.png** - Main dashboard with nearby taxi ranks
3. **rank-status.png** - Real-time taxi rank status with queue info
4. **driver-profile.png** - Driver verification profile with rating
5. **safety-features.png** - Trip sharing and emergency contacts

### Action Required:
Since the app is currently a web app (React + Vite):
- **Option 1:** Install Capacitor and run on emulator to capture screenshots
- **Option 2:** Create mockups using Figma/Canva based on the UI
- **Option 3:** Use PWA in browser DevTools device mode to capture

---

## 3. Privacy Policy - ✅ COMPLETE

**File:** `store-assets/privacy-policy.md`  
**Status:** Exists and POPIA-compliant

**Key Sections:**
- Data collection (location, device, user content)
- Data sharing with third parties
- User rights (access, correction, deletion)
- Data retention periods
- Location tracking consent
- Age restrictions (18+)
- Contact information

**Note:** Also exists in `docs/privacy-policy.md` for reference.

---

## 4. Store Description - ✅ COMPLETE

**File:** `store-assets/store-description.md`

**Contents:**
- Short description: 80 chars ✅
- Full description: ~4000 chars max ✅
- Keywords included
- Category: Maps & Navigation
- Content Rating: Teen (D) suggested

---

## 5. App Bundle (AAB) - ❌ CRITICAL BLOCKER

**Current State:** Boober is a **web-only PWA** (React + Vite)

**Problem:** Google Play Store requires an **Android App Bundle (.aab)** or **APK** file. PWAs cannot be directly submitted to the Play Store.

### Required Actions:

1. **Add Capacitor** to wrap the web app as a native Android app:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init
   npx cap add android
   ```

2. **Build the AAB:**
   ```bash
   npm run build
   npx cap sync android
   npx cap build android
   ```

3. **Configure app signing** - Generate a keystore for signing:
   ```bash
   keytool -genkey -v -keystore boober-release.keystore -alias boober -keyalg RSA -keysize 2048 -validity 10000
   ```

---

## 6. Play Store Requirements Checklist

### Content Rating Questionnaire
- [ ] Complete Google Play Content Rating questionnaire
- **Recommended:** "Teen" rating due to location features and user-generated content
- **URL:** https://play.google.com/console → App → Content rating

### Target Audience
- [x] 18+ (location features require adult consent)
- **Note:** App's privacy policy states minimum age is 18

### Data Safety Section
**Required Disclosures:**
- [x] Location data - Collected for ride matching
- [x] User content - Reviews, ratings, photos
- [ ] Financial info - N/A (cash-based system)
- [ ] Communications - N/A (no in-app messaging yet)

### App Signing Key
- [ ] Generate signing keystore
- [ ] Store keystore securely
- [ ] Configure in Google Play Console

---

## 7. Recommended Next Steps

### Immediate (Day 1):
1. ✅ Icons and graphics - Already complete
2. ⏳ Create 3-8 phone screenshots
3. ⏳ Set up Capacitor for mobile build

### Before Launch:
4. Complete Content Rating questionnaire
5. Configure Data Safety disclosures
6. Generate and configure app signing key
7. Build and test AAB locally
8. Create Google Play Developer account ($25 one-time)

---

## 8. File Locations

```
/home/workspace/Boober/store-assets/
├── icon-512.png              ✅ 512x512 app icon
├── app-icon-512.png          ✅ Alternative icon
├── feature-graphic-1024x500.png  ✅ Feature graphic
├── phone-screenshots/        ❌ (empty - needs screenshots)
├── privacy-policy.md         ✅ POPIA-compliant
└── store-description.md      ✅ Play Store listing content
```

---

## 9. Dependencies & Blocker Summary

| Blocker | Severity | Effort | Owner |
|---------|----------|--------|-------|
| No phone screenshots | High | Medium | Content Team |
| No mobile wrapper (AAB) | Critical | High | Dev Team |
| App signing key | High | Low | DevOps |
| Content rating | Medium | Low | PM |

---

**Conclusion:** Boober cannot be submitted to Google Play Store until:
1. Phone screenshots are created
2. Capacitor is added and AAB is built
3. App signing key is generated

The store assets (icons, privacy policy, description) are ready. The critical path item is now the mobile wrapper/AAB generation.

---

*Report generated by Play Store Prep Agent*