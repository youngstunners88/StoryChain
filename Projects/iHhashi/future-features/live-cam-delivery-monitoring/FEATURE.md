# Live Cam Delivery Monitoring

**Feature ID:** FTR-002  
**Status:** Future Feature (Not Implemented)  
**Created:** 2025-02-19  
**Priority:** Medium  
**Target Version:** v2.x  

---

## Overview

Allow customers to view a **live video feed** from their delivery service person's camera (chest or helmet mounted) during active delivery. This is an **optional premium add-on** that delivery service people can offer to earn extra income.

---

## Business Model

### Commission Structure
- **0% platform commission** on this feature
- Delivery person sets their own premium price for "Live Cam Monitoring"
- Full earnings go directly to the delivery person
- Platform benefits from increased trust, safety, and differentiation

### Pricing Example
| Service | Customer Pays | Delivery Person Earns | Platform Takes |
|---------|--------------|----------------------|----------------|
| Standard Delivery | R50 | R45 (10% commission) | R5 |
| Live Cam Add-on | +R20 | R20 (0% commission) | R0 |
| **Total** | R70 | R65 | R5 |

---

## User Stories

### Customer
1. "As a customer, I want to see a live feed of my delivery so I know exactly where my order is"
2. "As a customer, I want to watch my food being delivered for peace of mind about hygiene"
3. "As a customer, I want to tip my delivery person more after seeing their effort"

### Delivery Service Person
1. "As a delivery person, I want to offer live cam monitoring to earn extra money"
2. "As a delivery person, I want full control over when my camera is on/off"
3. "As a delivery person, I want to feel safer knowing customers can see my route"

---

## Technical Requirements

### Hardware Options
1. **Chest-mounted body cameras**
   - [Delivery-BodyCam by Displayride](https://gig.displayride.com/delivery-bodycam/) - Specifically designed for delivery drivers
   - [ZEPCAM T3 Live](https://zepcam.com/bodycam-logistics/) - Logistics-focused with livestreaming
   
2. **Helmet-mounted cameras**
   - GoPro with live streaming
   - Dedicated helmet cams with 4G/LTE connectivity

3. **Smartphone-based** (cheapest option)
   - Use delivery person's phone camera
   - Chest mount phone holder

### Software/Streaming Infrastructure

#### Option A: Third-Party SDKs (Recommended)
| SDK | Latency | Cost | Notes |
|-----|---------|------|-------|
| **Agora.io** | ~400ms | Pay-per-minute | Battle-tested, Flutter SDK available |
| **100ms** | <7s | Usage-based | Easy integration, scalable |
| **Cloudflare Stream + WebRTC** | Sub-second | Usage-based | No SDK lock-in, open standards |
| **Stream (GetStream.io)** | Low | Tiered pricing | Good documentation |
| **Ant Media Server** | 0.5s | Self-hosted or cloud | Flutter SDK, ultra-low latency |

#### Option B: Custom WebRTC Implementation
- Use Flutter WebRTC plugin: `flutter_webrtc` or `ant_media_flutter`
- Requires signaling server (can use Firebase or custom backend)
- More complex but more control

### App Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                     iHhashi App                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐    ┌──────────────┐  │
│  │   Customer   │     │   Backend    │    │  Delivery    │  │
│  │     App      │◄───►│    API       │◄──►│    App       │  │
│  └──────────────┘     └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    ▼                    │          │
│         │            ┌──────────────┐            │          │
│         │            │  Streaming   │            │          │
│         │            │   Server     │            │          │
│         │            │ (Agora/etc)  │            │          │
│         │            └──────────────┘            │          │
│         │                    │                    │          │
│         └────────────────────┼────────────────────┘          │
│                              │                               │
│                    WebRTC Live Stream                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Specifications

### Delivery Person Features
- [ ] Toggle live cam on/off during delivery
- [ ] Set custom price for live cam add-on (suggested: R15-R30)
- [ ] Privacy mode (pause stream during breaks)
- [ ] Emergency alert button (streams to platform support)
- [ ] Recording option for dispute resolution
- [ ] Earnings dashboard for live cam revenue

### Customer Features
- [ ] Opt-in to live cam monitoring during checkout (+R20 example)
- [ ] Picture-in-picture view while tracking delivery
- [ ] Full-screen live view option
- [ ] Screenshot capability
- [ ] Chat with delivery person during stream
- [ ] Rate the live cam experience separately

### Platform Features
- [ ] Stream quality monitoring
- [ ] Automatic recording of streams (dispute resolution)
- [ ] Analytics: uptake rate, satisfaction, safety incidents
- [ ] Fraud detection (stream manipulation)
- [ ] Bandwidth cost monitoring

---

## Privacy & Legal Considerations

### Privacy
- Customer consent required before stream starts
- Delivery person consent for camera use
- No recording without explicit consent
- Data retention policy (delete after X days)
- GDPR/POPIA compliance (South Africa)

### Legal
- Terms of service update for live streaming
- Liability waiver for delivery persons
- Customer code of conduct during streams
- Recording notification requirements

### Safety
- Delivery person can end stream instantly
- Platform can intervene if harassment detected
- Emergency services integration
- Location sharing controls

---

## Competitive Analysis

| Competitor | Live Cam Feature | Notes |
|------------|------------------|-------|
| Uber Eats | No | - |
| DoorDash | No | - |
| Mr D (SA) | No | - |
| Checkers Sixty60 | No | - |
| **iHhashi** | **Planned** | First-mover advantage in SA market |

**Opportunity:** This is a differentiating feature no major competitor offers.

---

## Implementation Roadmap

### Phase 1: Research & POC (2 weeks)
- [ ] Evaluate Agora vs 100ms vs Cloudflare Stream
- [ ] Build proof-of-concept with Flutter WebRTC
- [ ] Test latency and quality on SA networks
- [ ] Hardware testing with delivery team

### Phase 2: MVP Development (4 weeks)
- [ ] Backend streaming infrastructure
- [ ] Delivery app: camera toggle, stream controls
- [ ] Customer app: live view player
- [ ] Payment integration for add-on

### Phase 3: Beta Testing (2 weeks)
- [ ] Select group of delivery persons
- [ ] Limited customer rollout
- [ ] Gather feedback, iterate

### Phase 4: Full Launch (2 weeks)
- [ ] Marketing campaign
- [ ] Delivery person training
- [ ] Documentation and support

---

## Cost Estimates

### Infrastructure (Monthly)
| Item | Estimated Cost |
|------|----------------|
| Streaming (Agora ~$0.001/min) | R500-R2000 (scale dependent) |
| Recording storage | R200-R500 |
| Bandwidth | R300-R800 |
| **Total** | **R1000-R3300/month** |

### Hardware (Per Delivery Person)
| Option | Cost | Quality |
|--------|------|---------|
| Phone mount + use existing phone | R150-R300 | Good |
| Dedicated body cam (entry) | R800-R1500 | Good |
| Premium body cam (ZEPCAM) | R3000+ | Excellent |

---

## Rejected Solutions

### SitDeck (sitdeck.com)
- **Why rejected:** SitDeck is an OSINT (Open Source Intelligence) dashboard for monitoring conflicts, earthquakes, markets, and threats
- **Not suitable for:** Live video streaming from delivery personnel
- **Conclusion:** Wrong product category entirely

---

## Research Links

- [Delivery-BodyCam by Displayride](https://gig.displayride.com/delivery-bodycam/)
- [ZEPCAM for Logistics](https://zepcam.com/bodycam-logistics/)
- [Agora.io Flutter SDK](https://www.agora.io/en/)
- [Cloudflare Stream WebRTC](https://blog.cloudflare.com/webrtc-whip-whep-cloudflare-stream/)
- [100ms Live Streaming](https://www.100ms.live/)
- [Flutter WebRTC Plugin](https://pub.dev/packages/flutter_webrtc)
- [Ant Media Flutter SDK](https://antmedia.io/how-to-build-streaming-app-with-flutter-webrtc-sdk/)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-02-19 | Save as future feature | Requires infrastructure investment and testing |
| 2025-02-19 | 0% commission model | Incentivizes adoption, differentiates from competitors |

---

## Next Steps

1. Evaluate streaming providers (Agora recommended for Flutter)
2. Survey delivery persons for interest
3. Test network quality in target areas
4. Develop cost-benefit analysis for scale
