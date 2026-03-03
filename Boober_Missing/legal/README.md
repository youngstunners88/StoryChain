# Boober Legal Pages

This package contains all the legal and policy pages required for the Boober taxi-hailing app.

## Files Included

| File | Description | Route |
|------|-------------|-------|
| `TermsOfService.tsx` | Terms of Service agreement | `/legal/terms` |
| `PrivacyPolicy.tsx` | POPIA-compliant privacy policy | `/legal/privacy` |
| `CookiePolicy.tsx` | Cookie usage and management | `/legal/cookies` |
| `RefundPolicy.tsx` | Refund and cancellation policies | `/legal/refunds` |
| `CommunityGuidelines.tsx` | Community standards and rules | `/legal/community` |

## Installation

1. Copy the `src/pages/legal` folder to your project's `src/pages/` directory

2. Update your router configuration (e.g., in `App.tsx` or `routes.tsx`):

```tsx
import { 
  TermsOfService, 
  PrivacyPolicy, 
  CookiePolicy, 
  RefundPolicy, 
  CommunityGuidelines 
} from '@/pages/legal';

// In your routes:
<Route path="/legal/terms" element={<TermsOfService />} />
<Route path="/legal/privacy" element={<PrivacyPolicy />} />
<Route path="/legal/cookies" element={<CookiePolicy />} />
<Route path="/legal/refunds" element={<RefundPolicy />} />
<Route path="/legal/community" element={<CommunityGuidelines />} />
```

3. Ensure the `ScrollToTop` component exists at `@/components/ui/scroll-to-top` or remove the import if not needed.

## Features

- **Responsive Design**: Works on all screen sizes
- **TailwindCSS Styling**: Consistent with Boober's design system
- **South African Compliance**: 
  - POPIA (Protection of Personal Information Act) compliant
  - CPA (Consumer Protection Act) considerations
- **Mobile-First**: Optimised for app users

## Required Dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "lucide-react": "^0.263.1"
  }
}
```

## Customisation

Before going live, update the following placeholder information:

1. **Contact Information**: Replace `legal@boober.co.za`, `support@boober.co.za`, etc.
2. **Address**: Add your registered business address
3. **Phone Numbers**: Update the contact numbers
4. **Legal Entity Name**: Replace "Boober" with your registered company name if different
5. **Last Updated Date**: Update when you modify the policies

## Legal Compliance Checklist

- [ ] Review all policies with a legal professional
- [ ] Update contact information
- [ ] Add registered business address
- [ ] Configure cookie consent banner in the app
- [ ] Add links to legal pages in app settings/profile
- [ ] Set up data protection officer contact
- [ ] Implement privacy preference centre

## License

These legal pages are provided as templates. Consult with a South African legal professional before deploying to production.
