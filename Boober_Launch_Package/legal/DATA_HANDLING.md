# Boober Data Handling Document

**Version 1.0 | February 2025**

## 1. Overview

This document outlines how Boober handles, processes, and protects user data in compliance with the Protection of Personal Information Act (POPIA) and international best practices.

## 2. Data Categories

### 2.1 Personal Data

| Data Type | Purpose | Retention Period | Legal Basis |
|-----------|---------|------------------|-------------|
| Full Name | Account identification | Account lifetime + 30 days | Contract performance |
| Phone Number | Authentication, communication | Account lifetime + 30 days | Contract performance |
| Email Address | Communication, receipts | Account lifetime + 30 days | Consent |
| Profile Photo | User identification | Account lifetime + 30 days | Consent |
| ID Number | Driver verification only | Duration of verification | Legal obligation |

### 2.2 Location Data

| Data Type | Purpose | Retention Period | Legal Basis |
|-----------|---------|------------------|-------------|
| Real-time GPS | Active ride tracking | Duration of ride | Contract performance |
| Ride History | Trip records, disputes | 3 years | Legal obligation |
| Saved Locations | User convenience | Account lifetime | Consent |
| Analytics | Service improvement | 2 years (anonymised) | Legitimate interest |

### 2.3 Financial Data

| Data Type | Purpose | Retention Period | Legal Basis |
|-----------|---------|------------------|-------------|
| Transaction Records | Accounting, disputes | 5 years | Legal obligation |
| Payment Methods | Processing payments | Account lifetime | Contract performance |
| Card Details | Payment processing | Not stored (tokenised) | Contract performance |

### 2.4 Vehicle Data (Drivers)

| Data Type | Purpose | Retention Period | Legal Basis |
|-----------|---------|------------------|-------------|
| Registration Number | Verification, matching | Account lifetime | Legal obligation |
| License Disc | Roadworthiness verification | Validity period | Legal obligation |
| Insurance Details | Compliance verification | Validity period | Legal obligation |
| Vehicle Photos | User identification | Account lifetime | Consent |

## 3. Data Processing Activities

### 3.1 Ride Processing

```
User Requests Ride
       ↓
Collect: Pickup location, destination, route
       ↓
Process: Fare calculation, driver matching
       ↓
Store: Ride record (encrypted)
       ↓
Share: Driver (limited), Analytics (anonymised)
       ↓
Retain: 3 years for legal compliance
```

### 3.2 Payment Processing

```
User Initiates Payment
       ↓
Redirect to Payment Processor (PCI DSS compliant)
       ↓
Receive: Payment token (no card details)
       ↓
Store: Transaction record (encrypted)
       ↓
Retain: 5 years for financial compliance
```

### 3.3 Driver Verification

```
Driver Submits Documents
       ↓
Verify: PrDP, Vehicle Registration, Insurance
       ↓
Store: Verification status (not documents)
       ↓
Retain: Duration of driver status
       ↓
Delete: Upon account termination + 30 days
```

## 4. Data Storage

### 4.1 Infrastructure

- **Primary Storage:** AWS (Amazon Web Services) - Cape Town region (af-south-1)
- **Backup Storage:** AWS S3 with cross-region replication
- **Database:** PostgreSQL with encryption at rest
- **File Storage:** AWS S3 with server-side encryption

### 4.2 Encryption

| Layer | Method | Standard |
|-------|--------|----------|
| In Transit | TLS 1.3 | Industry standard |
| At Rest | AES-256 | Industry standard |
| Database | PostgreSQL encryption | Transparent Data Encryption |
| Backups | AWS KMS | AES-256 |

### 4.3 Access Controls

- **Role-Based Access Control (RBAC)** for all internal systems
- **Multi-Factor Authentication (MFA)** required for all staff
- **Least Privilege Principle** - access limited to job requirements
- **Audit Logging** - all data access logged and reviewable

## 5. Data Sharing

### 5.1 Internal Sharing

| Department | Data Access | Purpose |
|------------|-------------|---------|
| Engineering | Anonymised analytics | Product development |
| Customer Support | Limited PII (with consent) | Issue resolution |
| Finance | Transaction records | Financial reporting |
| Legal | Full access (on request) | Legal compliance |
| Marketing | Anonymised/aggregated | Campaign planning |

### 5.2 External Sharing

| Third Party | Data Shared | Purpose | Safeguards |
|-------------|-------------|---------|------------|
| Payment Processors | Payment tokens | Transaction processing | PCI DSS compliance |
| SMS Providers | Phone numbers | Notifications | DPA signed |
| Cloud Providers | Encrypted data | Infrastructure | SOC 2 certified |
| Analytics | Anonymised data | Insights | No PII shared |
| Government | As legally required | Compliance | Legal orders only |

## 6. Data Subject Rights

### 6.1 Rights Under POPIA

Users can exercise the following rights through the App or by contacting privacy@boober.co.za:

1. **Right of Access:** Request a copy of all personal data held
2. **Right to Correction:** Request correction of inaccurate data
3. **Right to Deletion:** Request deletion of personal data
4. **Right to Object:** Object to processing for direct marketing
5. **Right to Portability:** Receive data in a structured format
6. **Right to Complaint:** Lodge complaint with Information Regulator

### 6.2 Request Handling Process

```
Request Received
       ↓
Verify Identity (within 7 days)
       ↓
Process Request (within 30 days)
       ↓
Notify User of Outcome
       ↓
Implement Changes (within 14 days)
```

## 7. Data Breach Response

### 7.1 Incident Classification

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | Large-scale breach, sensitive data exposed | 1 hour |
| High | Breach affecting multiple users | 4 hours |
| Medium | Limited exposure, contained | 24 hours |
| Low | Potential vulnerability, no confirmed breach | 72 hours |

### 7.2 Response Procedure

1. **Identification:** Detection through monitoring or report
2. **Containment:** Isolate affected systems
3. **Assessment:** Determine scope and impact
4. **Notification:**
   - Information Regulator: Within 72 hours (POPIA requirement)
   - Affected users: Without undue delay
   - Public announcement (if required)
5. **Remediation:** Fix vulnerability, strengthen controls
6. **Review:** Post-incident analysis and improvements

### 7.3 Notification Template

Users will be notified via:
- In-app notification
- Email to registered address
- SMS for critical breaches

Notification will include:
- Nature of the breach
- Categories of data affected
- Likely consequences
- Measures taken
- Recommended actions for users

## 8. Data Retention Schedule

| Data Category | Retention Period | Reason |
|---------------|------------------|--------|
| Account Data | Account lifetime + 30 days | Service provision |
| Ride Records | 3 years | Legal requirement |
| Financial Records | 5 years | Tax regulations |
| Driver Verification | Duration of status + 1 year | Regulatory compliance |
| Support Tickets | 2 years after resolution | Dispute resolution |
| Analytics | 2 years (anonymised) | Service improvement |
| Logs | 90 days | Security monitoring |

## 9. Cross-Border Transfers

### 9.1 Transfer Mechanisms

When data must be transferred outside South Africa:

| Destination | Mechanism | Countries |
|-------------|-----------|-----------|
| AWS Services | Standard Contractual Clauses | USA, EU |
| Payment Processors | Binding Corporate Rules | USA, EU, UK |
| SMS Providers | Consent + DPA | Various |

### 9.2 Safeguards

- Data Protection Impact Assessment (DPIA) before transfers
- Ensure recipient has adequate protection measures
- Contractual obligations on recipient
- Regular audits of recipients

## 10. Security Measures

### 10.1 Technical Measures

- **Authentication:** JWT tokens, MFA for sensitive operations
- **Authorisation:** RBAC, principle of least privilege
- **Encryption:** TLS 1.3 in transit, AES-256 at rest
- **Monitoring:** 24/7 security monitoring, anomaly detection
- **Penetration Testing:** Quarterly by independent security firm
- **Vulnerability Scanning:** Continuous automated scanning

### 10.2 Organisational Measures

- **Training:** Mandatory data protection training for all staff
- **Policies:** Comprehensive data handling policies
- **Access Reviews:** Quarterly review of access rights
- **Incident Response:** Documented and tested procedures
- **Vendor Management:** Due diligence and ongoing monitoring

## 11. Compliance

### 11.1 POPIA Compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Information Officer Registration | ✅ Complete | Reg. No. XXXXX |
| Privacy Policy | ✅ Published | App & Website |
| Consent Mechanisms | ✅ Implemented | In-app consent flows |
| Data Subject Rights | ✅ Implemented | Privacy settings |
| Security Measures | ✅ Implemented | Technical & org measures |
| Breach Notification | ✅ Documented | Incident response plan |

### 11.2 Other Regulations

- **PAIA (Promotion of Access to Information Act):** PAIA manual available
- **ECTA (Electronic Communications and Transactions Act):** Electronic consent valid
- **Consumer Protection Act:** Fair terms and conditions

## 12. Contact Information

**Data Protection Officer**
- Name: [DPO Name]
- Email: dpo@boober.co.za
- Phone: +27 11 XXX XXXX

**Information Regulator (South Africa)**
- Website: www.justice.gov.za/inforeg
- Email: inforeg@justice.gov.za

---

*This document is reviewed annually or when significant changes occur.*

*Last Review: February 2025*
*Next Review: February 2026*
