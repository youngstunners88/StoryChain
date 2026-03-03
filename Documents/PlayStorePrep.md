# Google Play Store Preparation Guide (2026)

A comprehensive checklist for preparing your Android app for the Google Play Store.

---

## 1. Developer Account Setup

| Requirement | Details |
|-------------|---------|
| **Google Play Developer Account** | One-time $25 registration fee |
| **Developer Verification** | Required starting March 2026 - all developers must verify identity |
| **Payment Profile** | Set up in Play Console for paid apps/subscriptions |

📎 [Play Console](https://play.google.com/console) | [Developer Verification](https://developer.android.com/developer-verification/guides)

---

## 2. App Technical Requirements

### Build Configuration
- **Target SDK**: Android 14 (API level 34) minimum required[^1]
- **Minimum SDK**: Android 8.0 (API 26) recommended
- **App Bundle (.aab)**: Required for new apps (APK deprecated)[^2]
- **App Signing**: Enroll in Play App Signing (mandatory for new apps)

### App Bundle Settings
- Version code (increment for each release)
- Version name (user-facing, e.g., "1.0.0")
- Enable ProGuard/R8 for release builds

---

## 3. Store Listing Metadata

### Text Content

| Field | Character Limit | Best Practice |
|-------|-----------------|---------------|
| **App Title** | 30 characters | Brand name + primary keyword |
| **Short Description** | 80 characters | Hook + key benefit |
| **Full Description** | 4,000 characters | Detailed features, natural keywords |
| **Promo Text** | - | Rotating promotional text |

### Writing Tips
- Lead with benefits, not features
- Include relevant keywords naturally in descriptions
- Avoid: ALL CAPS, excessive punctuation, misleading claims[^3]

---

## 4. Visual Assets Required

### App Icon
- **Size**: 512 x 512 PNG
- **Background**: Solid colour or transparent
- **Style**: Simple, recognizable at small sizes

### Feature Graphic
- **Size**: 1024 x 500 PNG
- **Usage**: Featured section, search results
- **Tip**: Include app name and tagline

### Screenshots
| Device Type | Dimensions |
|-------------|------------|
| Phone portrait | 1080 x 1920 |
| Phone landscape | 1920 x 1080 |
| Tablet 7" | 1200 x 1920 |
| Tablet 10" | 1600 x 2560 |

**Requirements**:
- Minimum 2 screenshots (max 8)
- Show real app UI, not marketing fluff
- Include text overlays for localisation

### Optional Assets
- **Preview Video**: YouTube link, up to 90 seconds
- **TV Banner**: 1920 x 1080 PNG

---

## 5. Policy Compliance

### Content Rating
- Complete questionnaire in Play Console
- Affects age-appropriate filtering

### Privacy Policy
- **Required** for all apps
- Must be publicly accessible URL
- Must disclose data collection/usage
- Include: contact info, data handling, third-party SDKs

### Target Audience
- Set in Play Console
- Affects Play Store visibility

### Common Policy Violations to Avoid
- Misleading app descriptions or screenshots
- Impersonating other apps/brands
- Excessive advertising
- Inappropriate content
- Malicious behaviour

---

## 6. ASO (App Store Optimization)

### Keyword Research
- Target relevant search terms
- Include in: title, short description, full description
- Avoid keyword stuffing (penalised)

### Conversion Rate Optimisation
- High-quality screenshots showing real UI
- Compelling icon (test different versions)
- Preview video if possible
- Good ratings (4+ stars target)

### Localisation
- Translate store listing to target market languages
- Professional translation recommended
- Adjust screenshots for local markets

---

## 7. Pre-Launch Checklist

- [ ] Developer account verified
- [ ] App builds successfully in release mode
- [ ] Target SDK 34+ (API level)
- [ ] App bundle (.aab) generated and signed
- [ ] App icon 512x512 created
- [ ] Feature graphic 1024x500 created
- [ ] Screenshots for all required sizes
- [ ] Short description written (80 chars)
- [ ] Full description written (4000 chars)
- [ ] Privacy policy URL ready
- [ ] Content rating questionnaire completed
- [ ] Target audience configured
- [ ] Pricing & distribution set (free/paid)
- [ ] Tested on internal test track
- [ ] App content aligns with Play Store policies

---

## 8. Submission Process

1. **Create App** in Play Console
2. **Fill Store Listing** (all metadata + assets)
3. **Upload App Bundle** (.aab file)
4. **Complete Pricing & Distribution**
5. **Release to Testing Track** (recommended)
6. **Submit for Review** (review typically 1-3 days)
7. **Publish** after approval

---

## References

[^1]: Google Play target API requirements - https://support.google.com/googleplay/android-developer/answer/11926878
[^2]: App signing and bundle requirements - https://medium.com/@bayufasmoro/a-guide-to-submitting-your-app-to-google-play-console-6eea17834e1f
[^3]: Store listing best practices - https://support.google.com/googleplay/android-developer/answer/13393723