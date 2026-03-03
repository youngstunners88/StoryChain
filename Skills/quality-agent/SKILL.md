---
name: quality-agent
description: Quality assurance agent that catches glitches, enforces standards, and validates iHhashi against South African requirements. Works alongside Brand Agent and Claude Code.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  project: iHhashi
---

# Quality Agent

The vigilant QA specialist that catches glitches before users do.

## Quality Checks

### 1. UI/UX Glitches

- **Broken images** - Missing product/vendor images
- **Text overflow** - Content spilling outside containers
- **Broken links** - 404s and dead ends
- **Loading states** - Missing spinners/skeleton screens
- **Error handling** - User-friendly error messages
- **Empty states** - Graceful handling of no data
- **Responsive design** - Works on all screen sizes

### 2. South African Specific

- **Currency display** - Must show "R" not "$" or "USD"
- **Phone numbers** - +27 format, 10 digits
- **Addresses** - SA address format
- **VAT** - 15% correctly calculated
- **Provinces** - All 9 supported
- **Languages** - i18n keys present for all 6 languages
- **Time zone** - SAST displayed correctly

### 3. Performance

- **API response time** - Under 2 seconds
- **Image optimization** - WebP format, lazy loading
- **Bundle size** - Frontend under 500KB initial
- **Database queries** - Indexed, no N+1 problems

### 4. Security

- **Authentication** - Token valid, not expired
- **Authorization** - User can access resource
- **Input validation** - All inputs sanitized
- **Rate limiting** - Prevents abuse
- **CORS** - Correct origins allowed

### 5. Accessibility

- **Screen readers** - ARIA labels present
- **Color contrast** - WCAG AA compliant
- **Font sizes** - Readable on mobile
- **Touch targets** - 44px minimum

## Usage

```bash
# Run all quality checks
bun /home/workspace/Skills/quality-agent/scripts/check.ts --all

# Check specific area
bun /home/workspace/Skills/quality-agent/scripts/check.ts --ui
bun /home/workspace/Skills/quality-agent/scripts/check.ts --sa-specific
bun /home/workspace/Skills/quality-agent/scripts/check.ts --performance
bun /home/workspace/Skills/quality-agent/scripts/check.ts --security

# Check a specific file or route
bun /home/workspace/Skills/quality-agent/scripts/check.ts --file "frontend/src/pages/OrderPage.tsx"

# Generate quality report
bun /home/workspace/Skills/quality-agent/scripts/report.ts --output quality-report.md
```

## Glitch Categories

| Severity | Description | Examples |
|----------|-------------|----------|
| **Critical** | Blocks user from completing task | Payment fails, checkout broken |
| **High** | Major feature not working | Search returns nothing, map not loading |
| **Medium** | Feature partially broken | Images not loading, slow performance |
| **Low** | Cosmetic issue | Wrong color, typo, alignment off |
| **Enhancement** | Suggested improvement | Better UX, optimisation |

## Integration with Other Agents

1. **After Claude Code builds** → Quality Agent checks
2. **After Brand Agent transforms** → Quality Agent validates SA compliance
3. **Before deployment** → Full quality report

## Automated Checks

```bash
# Add to CI/CD pipeline
bun /home/workspace/Skills/quality-agent/scripts/ci-check.ts
```

Returns exit code 0 if all checks pass, 1 if any fail.
