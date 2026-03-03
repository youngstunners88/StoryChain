# Boober Google Play Store Preparation Report

**Generated:** 2026-02-24 01:30 SAST  
**Agent:** Play Store Preparation Agent  
**Status:** IN PROGRESS

---

## Executive Summary

Boober is a South African taxi network app ("SA'S #1 TAXI NETWORK") that connects passengers with verified taxi drivers and provides real-time taxi rank status information. The app currently exists as a React + Vite web application and requires mobile wrapper integration to generate an Android App Bundle (AAB) for Google Play Store submission.

---

## Checklist Status

| Item | Status | Notes |
|------|--------|-------|
| App Bundle/AAB | ❌ NOT READY | No mobile build configured - needs Capacitor integration |
| App Icons | ✅ COMPLETE | icon-512.png (512×512) created |
| Feature Graphic | ✅ COMPLETE | feature-graphic-1024x500.png (1024×500) created |
| Screenshots | ❌ NOT READY | phone-screenshots/ directory created, 0/8 screenshots |
| Privacy Policy | ✅ COMPLETE | privacy-policy.md in store-assets/ (POPIA compliant) |
| Store Description | ✅ COMPLETE | store-description.md complete with all required sections |

---

## Required Assets Status

### ✅ Existing Assets (Verified)

```
/home/workspace/Boober/store-assets/
├── icon-512.png              # 512×512 PNG (✅ verified)
├── feature-graphic-1024x500.png  # 1024×500 PNG (✅ verified)
├── store-description.md      # Complete with short + full description
├── privacy-policy.md         # POPIA compliant (copied from docs/)
└── phone-screenshots/        # Directory created, needs screenshots
```

### Short Description (80 chars)
> Real-time taxi rank status, verified drivers, safer rides across South Africa.

### App Description Highlights
- Real-time rank status with marshal-reported updates
- Verified driver community
- Safety features (trip sharing, emergency contacts)
- Cash-based system (no payment integration)
- 3 roles: Passenger, Driver, Marshal

---

## App Bundle/AAB Status

### Current Build Configuration
```json
{
  "name": "my-app",
  "version": "0.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build"
  }
}
```

**Issue:** The current build process generates only a web application (static HTML/JS/CSS). It does NOT create an Android App Bundle (AAB) or APK required for Google Play Store.

### Required: Mobile Wrapper Integration

To publish on Google Play, the app must be wrapped with a mobile framework:

**Recommended: Capacitor**
- Open-source native runtime for web apps
- Minimal configuration required
- Maintains web codebase while enabling mobile features
- Generates AAB/APK for Play Store

**Alternative: Cordova/Ionic**
- More mature but older architecture
- Larger app size
- More configuration overhead

---

## Screenshots Status

### Requirements
- **Minimum**: 3 screenshots
- **Maximum**: 8 screenshots  
- **Format**: PNG or JPEG, max 8MB each
- **Aspect ratio**: 16:9 landscape or 9:16 portrait

### Current Status
- **Created**: `/home/workspace/Boober/store-assets/phone-screenshots/`
- **Count**: 0 screenshots (placeholder README created)

### Required Screenshots
1. Onboarding/welcome screen (role selection)
2. Home dashboard with taxi ranks
3. Real-time rank status view
4. Driver profile/verification
5. Safety features (trip sharing)
6. Map view with rank locations

### Action Required
Screenshots must be captured from:
- A device/emulator running the Capacitor-wrapped app, OR
- Browser DevTools device mode, OR
- Design mockups from Figma/Canva

---

## Privacy Policy Status

### ✅ Complete - POPIA Compliant

**Location:** `/home/workspace/Boober/store-assets/privacy-policy.md`

**Key Points:**
- Last Updated: February 24, 2026
- Compliance: Protection of Personal Information Act (POPIA)
- Data collected: Name, contact info, location, usage data
- Location tracking: Always opt-in
- User rights: Access, correction, deletion, objection, complaint
- Contact: privacy@boober.app, support@boober.app
- Data retention: Active accounts retained, inactive after 2 years
- Children: Not intended for under 18

### Data Safety Section (for Play Store)

| Data Type | Collection | Purpose |
|-----------|------------|---------|
| Location | Yes (opt-in) | Show nearby ranks, trip sharing |
| Personal info | Yes | Account creation, driver verification |
| User content | Yes | Reviews, ratings, social posts |
| App activity | Yes | Usage analytics, feature improvement |
| Device info | Yes | Bug fixes, compatibility |

---

## Play Store Requirements Check

### 1. Content Rating Questionnaire
- **Status**: NOT STARTED
- **Required**: Complete Google Play's Content Rating questionnaire
- **Recommended Rating**: Teen (due to location features, user-generated content)
- **Action**: Submit in Play Console after app upload

### 2. Target Audience
- **Status**: NOT STARTED  
- **Recommended**: 18+ (due to location features)
- **Rationale**: Location sharing, taxi transportation context

### 3. Data Safety Section
- **Status**: IN PROGRESS
- **Completed**: Privacy policy documents data practices
- **Required**: Fill in Play Console Data Safety form
- **Key disclosures**:
  - Location data collected (opt-in)
  - User content (reviews, ratings)
  - No third-party data sharing
  - No payment data collected

### 4. App Signing Key
- **Status**: NOT STARTED
- **Note**: Play App Signing will be configured when uploading AAB
- **Option**: Use Google-managed signing key (recommended for new apps)

---

## Recommended Next Steps

### Priority 1: Mobile Build Setup
1. Install Capacitor: `npm install @capacitor/core @capacitor/cli`
2. Initialize: `npx cap init`
3. Add Android: `npx cap add android`
4. Build AAB: `npx cap build android --prod`

### Priority 2: Screenshots
1. Set up Capacitor and run on device/emulator
2. Capture 6 high-quality screenshots
3. Ensure consistent aspect ratio (recommend 9:16 portrait)

### Priority 3: Play Store Submission
1. Create Google Play Developer account ($25 one-time)
2. Complete Content Rating questionnaire
3. Fill Data Safety section
4. Upload AAB
5. Submit for review

---

## Files Created/Modified

| File | Action |
|------|--------|
| `/home/workspace/Boober/store-assets/icon-512.png` | Created (resized from source) |
| `/home/workspace/Boober/store-assets/feature-graphic-1024x500.png` | Created (resized from source) |
| `/home/workspace/Boober/store-assets/privacy-policy.md` | Copied from docs/ |
| `/home/workspace/Boober/store-assets/phone-screenshots/README.md` | Created (placeholder guidance) |
| `/home/workspace/Boober/store-assets/store-description.md` | Already existed |

---

## Conclusion

Boober has solid foundational assets for Play Store submission:
- ✅ Complete privacy policy (POPIA compliant)
- ✅ Proper store description
- ✅ App icon and feature graphic (corrected)
- ❌ Missing mobile build (needs Capacitor)
- ❌ Missing screenshots

**Estimated timeline to submission:**
- Capacitor setup: 1-2 hours
- Screenshot capture: 30 minutes
- Play Console setup: 1 hour
- Review: 1-3 days

---

*Report generated by Boober Play Store Preparation Agent*