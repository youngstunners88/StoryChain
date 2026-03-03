# Boober Icon Design Specifications

## App Icon

### Primary Icon Design
- **Symbol**: Stylised minibus taxi with location pin
- **Style**: Modern, flat design with subtle gradients
- **Primary Colour**: #E63946 (Boober Red)
- **Secondary Colour**: #FFFFFF (White)
- **Accent Colour**: #FFD166 (Yellow/Gold for highlights)

### Icon Variations

#### Standard App Icon
```
┌─────────────────┐
│                 │
│    ┌─────┐      │
│   ╱  🚕   ╲     │
│  │   PIN   │    │
│   ╲       ╱     │
│    └─────┘      │
│                 │
│     BOOBER      │
│                 │
└─────────────────┘
```

#### Icon Elements
- Base: Rounded square (iOS/Android standard)
- Background: Gradient from #E63946 to #c1121f
- Centre: White minibus taxi silhouette
- Top-right: Location pin overlay
- Optional: "Go" badge in yellow

### Size Requirements

#### iOS
| Size | Usage |
|------|-------|
| 180x180 | App Store |
| 120x120 | iPhone |
| 76x76 | iPad |
| 152x152 | iPad Pro |
| 167x167 | iPad Pro (2x) |
| 1024x1024 | App Store Marketing |

#### Android
| Size | DPI | Usage |
|------|-----|-------|
| 48x48 | mdpi | Launcher |
| 72x72 | hdpi | Launcher |
| 96x96 | xhdpi | Launcher |
| 144x144 | xxhdpi | Launcher |
| 192x192 | xxxhdpi | Launcher |
| 512x512 | Play Store | Feature |

#### PWA / Web
| Size | Usage |
|------|-------|
| 72x72 | Browser icon |
| 96x96 | Browser icon |
| 128x128 | Browser icon |
| 144x144 | Browser icon |
| 152x152 | Browser icon |
| 192x192 | Android Chrome |
| 384x384 | Android Chrome |
| 512x512 | Android Chrome |
| favicon.ico | 16x16, 32x32, 48x48 |

---

## Logo Specifications

### Full Logo
```
┌─────────────────────────────────┐
│                                 │
│    ┌───┐                        │
│   │🚕 │  BOOBER                 │
│    └───┘                        │
│                                 │
│   Johannesburg's Premier        │
│   Minibus Taxi App              │
│                                 │
└─────────────────────────────────┘
```

### Logo Variations

#### Horizontal Layout
```
[🚕] BOOBER
```
- Icon on left, text on right
- For headers, nav bars

#### Vertical Layout
```
    [🚕]
   BOOBER
```
- Icon above text
- For splash screens, loading screens

#### Icon Only
```
   [🚕]
```
- For favicons, app icons, small spaces

#### Text Only
```
BOOBER
```
- For partner links, mentions

---

## Colour Palette

### Primary Colours
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Boober Red | #E63946 | 230, 57, 70 | Primary brand, CTAs |
| Boober Dark | #c1121f | 193, 18, 31 | Hover states, accents |

### Secondary Colours
| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| White | #FFFFFF | 255, 255, 255 | Backgrounds, text |
| Light Gray | #F9FAFB | 249, 250, 251 | Backgrounds |
| Dark Gray | #111827 | 17, 24, 39 | Text |
| Success Green | #10B981 | 16, 185, 129 | Confirmations |
| Warning Yellow | #FFD166 | 255, 209, 102 | Alerts |

---

## Typography

### Logo Font
- **Font**: Inter Bold
- **Weight**: 700
- **Letter Spacing**: -0.02em
- **Case**: UPPERCASE

### Supporting Fonts
- **Headings**: Inter SemiBold (600)
- **Body**: Inter Regular (400)
- **Captions**: Inter Medium (500)

---

## Splash Screen Specifications

### iOS Launch Screen
- **Size**: 2778 x 1284 (iPhone 14 Pro Max)
- **Background**: White or Gradient
- **Logo**: Centred, 200x200 icon
- **Text**: "Boober" below icon

### Android Splash Screen
- **Size**: 1080 x 1920
- **Background**: #E63946 gradient
- **Logo**: Centred, white icon
- **Duration**: 2 seconds max

### PWA Splash Screen
- **Background**: #E63946
- **Logo**: White, centred
- **Theme Colour**: #E63946

---

## Marketing Assets

### Social Media
| Platform | Size | Usage |
|----------|------|-------|
| Twitter | 1500x500 | Header |
| Twitter | 400x400 | Profile |
| Facebook | 1200x630 | Post |
| Facebook | 170x170 | Profile |
| Instagram | 1080x1080 | Post |
| Instagram | 1080x1920 | Story |
| LinkedIn | 1128x191 | Banner |
| LinkedIn | 400x400 | Profile |

### App Store
| Asset | Size | Usage |
|-------|------|-------|
| Feature Graphic | 1024x500 | Play Store |
| Promo Banner | 1800x1200 | Apple Store |
| Screenshot Phone | 1080x1920 | Both stores |
| Screenshot Tablet | 2048x2732 | iPad Pro |

### Print Materials
| Asset | Size | Usage |
|-------|------|-------|
| Business Card | 90x50mm | Networking |
| Flyer A5 | 148x210mm | Handouts |
| Poster A3 | 297x420mm | Ranks |
| Sticker | 100x100mm | Taxi branding |

---

## Icon Design Rules

### Do's
✅ Use the brand colours consistently
✅ Keep the design simple and recognisable
✅ Ensure visibility at small sizes
✅ Use white on dark backgrounds
✅ Maintain padding around icon
✅ Test on both light and dark backgrounds

### Don'ts
❌ Don't add drop shadows to the icon
❌ Don't stretch or distort the icon
❌ Don't change the colour palette
❌ Don't add text inside the icon
❌ Don't use low-resolution versions
❌ Don't place on busy backgrounds

---

## Safe Zones

### App Icon Safe Zone
```
┌─────────────────┐
│ ┌─────────────┐ │
│ │             │ │
│ │   ICON      │ │
│ │   CONTENT   │ │
│ │             │ │
│ └─────────────┘ │
└─────────────────┘
```
- 10% padding from edge
- No critical elements in outer 10%

### Logo Safe Zone
- Minimum 20px padding around logo
- Logo should never touch other elements

---

## Animation Guidelines

### Loading Animation
- Icon pulses with heartbeat effect
- Duration: 1-2 seconds
- Ease: ease-in-out
- Use for: loading states, processing

### Success Animation
- Checkmark appears inside icon
- Duration: 0.5 seconds
- Ease: spring
- Use for: ride confirmed, payment success

### Notification Animation
- Icon shakes left-right
- Duration: 0.3 seconds
- Ease: ease-out
- Use for: new ride request, alert

---

## Accessibility

### Colour Contrast
- All text must meet WCAG AA (4.5:1 ratio)
- Large text must meet WCAG AA (3:1 ratio)
- Interactive elements must have 3:1 contrast

### Screen Reader
- Icon alt text: "Boober taxi app logo"
- Provide text labels for icon-only buttons

### Motion
- Respect prefers-reduced-motion
- Provide static alternatives for animations

---

*Document Version: 1.0*
*Created: February 2025*
