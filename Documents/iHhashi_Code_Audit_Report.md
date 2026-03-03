# 🐰 iHhashi Code Audit Report

**Repository:** github.com/youngstunners88/ihhashi  
**Date:** 27 February 2026  
**Framework:** FastAPI (Backend) + React/TypeScript (Frontend)  
**Database:** MongoDB  

---

## 🔴 CRITICAL SECURITY ISSUES

### 1. Hardcoded Secret Key
**File:** `backend/app/config.py`  
**Line:** `secret_key: str = "dev_secret_key_change_in_production"`  
**Impact:** JWT tokens can be forged by anyone with access to the code  
**Fix:**
```python
secret_key: str = Field(default=None)  # Fail if not set
# Add validation in __init__:
if not self.secret_key and self.environment == "production":
    raise ValueError("SECRET_KEY must be set in production")
```

### 2. No ObjectId Validation
**File:** `backend/app/routes/orders.py` and other route files  
**Issue:** All `ObjectId()` conversions lack try/except blocks  
**Risk:** Invalid IDs cause 500 errors and potential information disclosure  
**Fix:**
```python
from bson.errors import InvalidId

def safe_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")
```

### 3. Missing Rate Limiting Implementation
**File:** `backend/app/config.py`  
**Issue:** Config has `rate_limit_requests` and `rate_limit_period` but no actual middleware  
**Risk:** Auth endpoints vulnerable to brute force attacks  
**Fix:** Implement rate limiting middleware using Redis or in-memory store

---

## 🟠 HIGH PRIORITY ISSUES

### 4. Missing Input Validation
- No maximum limit on payment amounts
- Phone numbers not validated for South African format (+27)
- No validation on address fields

### 5. Database Connection Issues
- No connection pooling configured
- No timeout settings for MongoDB
- Risk of connection leaks under load

### 6. Sensitive Data in Logs
**File:** `backend/app/routes/payments.py`  
Webhook handler logs full payment data including potentially sensitive information.

### 7. CORS Configuration Too Permissive
```python
allow_methods=["*"],
allow_headers=["*"],
```
Should specify only the methods and headers actually needed.

### 8. No Token Blacklist/Revocation
- Logged out tokens remain valid until expiration
- No refresh token rotation
- Compromised tokens cannot be revoked

### 9. Hardcoded Callback URL
**File:** `backend/app/routes/payments.py`  
`callback_url = "https://ihhashi.app/payment/callback"`  
Should use environment variable.

---

## 🟡 MEDIUM PRIORITY ISSUES

### 10. No Request ID/Tracing
- Cannot trace requests across services
- Debugging distributed transactions is difficult
- Add `X-Request-ID` header middleware

### 11. Verbose Error Messages
Exception details returned to client in some endpoints. Risk of information disclosure.

### 12. Missing Type Hints
Several functions lack return type annotations, reducing code maintainability.

### 13. Inconsistent Error Handling
Mix of `HTTPException` raises and try/except blocks across files.

---

## 📊 CODE QUALITY ISSUES

### 14. TODO Comments for Critical Features
Many features marked as TODO but not implemented:
- Refund logic in cancel_order
- Push notifications
- Wallet/balance check before payouts
- Order confirmation flow
- Update buyer stats, rider earnings, store stats

### 15. Duplicate Code
ObjectId conversion logic repeated 10+ times across files. Should be a utility function.

### 16. No Unit Tests
- Only placeholder tests in Android folder
- No backend test files found
- No frontend test files found

---

## 🖥️ FRONTEND ISSUES

### 17. Token in localStorage
**File:** `frontend/src/lib/api.ts`  
`localStorage.getItem('access_token')`  
**Risk:** Vulnerable to XSS attacks  
**Fix:** Use httpOnly cookies for token storage

### 18. No CSRF Protection
State-changing requests lack CSRF tokens, vulnerable to cross-site request forgery.

### 19. Hardcoded API URLs
Multiple base URLs defined in `getBaseURL()`. Should use single environment variable.

### 20. Unencrypted Sensitive Data
Addresses stored in localStorage without encryption.

---

## 🏗️ ARCHITECTURE RECOMMENDATIONS

### 1. Add Redis for:
- Session management
- Rate limiting
- Caching frequently accessed data
- Token blacklist

### 2. Implement Proper Logging:
```python
import structlog
logger = structlog.get_logger()
logger.info("order_created", order_id=order_id, user_id=user_id)
```

### 3. API Versioning:
- Currently has `/api` and `/api/v2` routes
- Standardize on one approach (recommend `/api/v1/...`)

### 4. Database Indexes:
No index definitions found. Add indexes on:
- `orders`: buyer_id, store_id, status, created_at
- `users`: email, phone
- `drivers`: status, location (geo index)
- `payments`: reference, user_id, status

### 5. Background Tasks:
Use Celery or similar for:
- Push notifications
- Payout processing
- Report generation
- Email sending

---

## ✅ WHAT'S GOOD

- ✓ Async/await throughout backend
- ✓ Pydantic for data validation
- ✓ Passwords hashed with bcrypt
- ✓ JWT with expiration configured
- ✓ Security headers middleware
- ✓ Webhook signature verification
- ✓ Offline mode handling for SA networks
- ✓ Multi-language support
- ✓ VAT calculation built-in
- ✓ South Africa-specific features (load shedding awareness)

---

## 🎯 PRIORITY ACTION ITEMS

### IMMEDIATE (Before Production Launch):
1. Remove hardcoded `secret_key` - use environment variable
2. Add rate limiting to auth endpoints
3. Implement token blacklist for logout
4. Add input validation on all endpoints
5. Create database indexes

### SHORT TERM (Next Sprint):
6. Write unit tests (aim for 60% coverage minimum)
7. Add request tracing/logging with correlation IDs
8. Fix CORS configuration to be restrictive
9. Move tokens to httpOnly cookies
10. Add CSRF protection

### MEDIUM TERM (Next Quarter):
11. Add Redis for caching and session management
12. Implement background workers for notifications
13. Add monitoring/alerting (DataDog, New Relic, etc.)
14. Security audit by external firm
15. Penetration testing

---

## 📈 ESTIMATED EFFORT

| Priority | Issues | Est. Hours |
|----------|--------|------------|
| Critical | 3 | 16h |
| High | 6 | 24h |
| Medium | 5 | 16h |
| Tests | 1 | 40h |
| **Total** | **15** | **96h** |

---

*Audit completed by Zo AI Assistant*  
*Generated: 27 February 2026*
