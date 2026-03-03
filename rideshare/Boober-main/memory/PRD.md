# Boober - SA's #1 Taxi Network

## Original Problem Statement
Build and maintain "Boober", a South African Uber-like taxi application with three user roles: Passenger, Driver, and Marshal. The app allows ride tracking, community communication, referral rewards, and rank status management.

## Architecture
- **Frontend**: React + TypeScript + Vite + TailwindCSS (located at `/app/frontend/`)
- **Backend**: Not used (frontend-only with mock data)
- **State Management**: React Hooks (useState, useEffect) with prop drilling from App.tsx
- **UI Libraries**: Shadcn/UI, lucide-react icons

## Key Files
- `src/App.tsx` - Main state management, message handling, routing
- `src/components/Onboarding/OnboardingFlow.tsx` - Multi-step onboarding
- `src/components/PassengerDashboard.tsx` - Passenger view with comms, map, referrals
- `src/components/DriverDashboard.tsx` - Driver view with trip management, comms
- `src/components/MarshalDashboard.tsx` - Marshal view with rank status, comms
- `src/components/ReferralRewards.tsx` - Social sharing and referral links
- `src/components/SocialFeed.tsx` - Tavern community feed with voice notes

## What's Been Implemented (as of Feb 20, 2026)

### Completed Features
- Three-role onboarding flow (Passenger, Driver, Marshal) with back buttons
- "SHO! WE LIVE!" welcome screen for all roles
- Driver signup with color wheel and brand dropdown
- Real-time map with route tracking
- Comms Hub with DRIVERS/MARSHALS/PASSENGERS channels (properly segregated)
- Cross-role review system
- Referral system with Twitter, WhatsApp, Facebook, Instagram sharing
- Copy invite link functionality
- Voice note recording in Tavern
- Marshal rank status updates (+30 points)
- Price board for all roles
- Leaderboard and points system
- Content moderation
- Offline mode support
- GPS tracking
- Daily streak bonuses

### Bug Fixes Completed (Feb 20, 2026)
- Fixed comms message segregation (messages now strictly filtered by channel)
- Fixed Driver comms panel broken JSX structure (was closing prematurely)
- Fixed voice note recording logic (state set after getUserMedia succeeds)
- Added data-testids to all referral buttons and voice note button
- Verified slogan displays "SA'S #1 TAXI NETWORK"
- Verified back buttons on all onboarding steps 2-5
- Verified Marshal dashboard has referral rewards section
- Verified all comms overlays are proper fixed panels above other content

## Testing Status
- Testing agent iteration 4: 16/16 tests passed (100%)
- All P0/P1/P2 issues resolved

## Backlog / Future Tasks
- State management refactor (prop drilling -> Context/Zustand)
- Component decomposition (large monolithic components)
- Backend integration for real data persistence
- Real-time messaging with WebSocket
- Payment integration
- Push notifications
