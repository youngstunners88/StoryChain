---
name: shield-guard
description: Security agent for API key management, authentication validation, input sanitization, and security auditing. Protects the codebase from vulnerabilities.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# ShieldGuard Agent

Security-first agent that protects iHhashi and other projects.

## Capabilities

- **API Key Management**: Securely store and rotate API keys
- **Input Validation**: Sanitize user inputs, prevent injection attacks
- **Auth Auditing**: Review authentication implementations for vulnerabilities
- **Secret Rotation**: Manage and rotate secrets securely
- **Security Headers**: Ensure proper CORS, CSRF protection
- **Rate Limiting**: Implement and audit rate limiting

## Usage

```bash
bun /home/workspace/Skills/shield-guard/scripts/shield.ts --audit
bun /home/workspace/Skills/shield-guard/scripts/shield.ts --validate-keys
bun /home/workspace/Skills/shield-guard/scripts/shield.ts --sanitize
```

## API Keys Managed

- Groq API keys (for Nduna chatbot)
- Paystack keys (payments)
- Supabase keys (auth)
- Firebase keys (push notifications)
