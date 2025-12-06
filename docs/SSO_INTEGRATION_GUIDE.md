# Enterprise SSO Integration Guide

## KelpHR ConductOS - Single Sign-On Integration

**Version:** 1.0
**Last Updated:** December 2024
**Compliance:** SOC 2 Type II, GDPR, ISO 27001

---

## Table of Contents

1. [Overview](#overview)
2. [Supported Identity Providers](#supported-identity-providers)
3. [Integration Architecture](#integration-architecture)
4. [SAML 2.0 Configuration](#saml-20-configuration)
5. [OpenID Connect Configuration](#openid-connect-configuration)
6. [Just-In-Time Provisioning](#just-in-time-provisioning)
7. [SCIM Provisioning](#scim-provisioning)
8. [Attribute Mapping](#attribute-mapping)
9. [Security Features](#security-features)
10. [Admin Configuration](#admin-configuration)
11. [Troubleshooting](#troubleshooting)
12. [API Reference](#api-reference)

---

## Overview

ConductOS provides enterprise-grade Single Sign-On (SSO) integration supporting both SAML 2.0 and OpenID Connect (OIDC) protocols. This enables seamless authentication for employees using their existing corporate identity provider (IdP).

### Key Features

- **Multi-Protocol Support**: SAML 2.0 and OpenID Connect
- **Just-In-Time (JIT) Provisioning**: Automatic user creation on first login
- **SCIM 2.0 Support**: Directory synchronization with corporate directories
- **Attribute Mapping**: Flexible mapping of IdP attributes to user profiles
- **Group-to-Role Mapping**: Automatic role assignment based on IdP groups
- **Multi-Organization**: Support for multiple organizations with different IdPs
- **Domain Verification**: Secure domain ownership verification
- **Comprehensive Audit Logging**: Complete audit trail for compliance

### Benefits

- **Reduced IT Overhead**: No separate credentials to manage
- **Enhanced Security**: Leverage existing MFA and security policies
- **Compliance Ready**: Meet regulatory requirements for authentication
- **User Experience**: One-click login with corporate credentials

---

## Supported Identity Providers

ConductOS has been tested and verified with the following identity providers:

### Tier 1 - Full Support
| Provider | SAML 2.0 | OIDC | SCIM | Notes |
|----------|----------|------|------|-------|
| Microsoft Entra ID (Azure AD) | ✅ | ✅ | ✅ | Recommended for Microsoft 365 environments |
| Okta | ✅ | ✅ | ✅ | Full lifecycle management |
| Google Workspace | ✅ | ✅ | ❌ | Google Admin Directory API for provisioning |
| OneLogin | ✅ | ✅ | ✅ | Full HR-driven lifecycle |

### Tier 2 - Tested
| Provider | SAML 2.0 | OIDC | SCIM |
|----------|----------|------|------|
| Ping Identity | ✅ | ✅ | ✅ |
| Auth0 | ✅ | ✅ | ❌ |
| JumpCloud | ✅ | ✅ | ✅ |
| Duo Security | ✅ | ❌ | ❌ |

### Custom/Generic
Any SAML 2.0 or OIDC-compliant identity provider can be configured using manual configuration.

---

## Integration Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  User Browser   │────▶│   ConductOS      │────▶│  Identity       │
│                 │     │   (SP)           │     │  Provider (IdP) │
│                 │◀────│                  │◀────│                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   ConductOS      │
                        │   Database       │
                        │   (User Store)   │
                        └──────────────────┘
```

### Authentication Flow

#### SAML 2.0 Flow
1. User accesses ConductOS login page
2. User enters corporate email
3. ConductOS detects SSO provider from email domain
4. User clicks "Sign in with SSO"
5. Browser redirects to IdP (SP-initiated SSO)
6. User authenticates at IdP
7. IdP sends SAML assertion to ConductOS ACS endpoint
8. ConductOS validates assertion and extracts attributes
9. User is provisioned/updated (JIT) and logged in
10. User redirected to dashboard

#### OIDC Flow
1. User accesses ConductOS login page
2. User enters corporate email
3. ConductOS detects OIDC provider from email domain
4. User clicks "Sign in with SSO"
5. Browser redirects to IdP authorization endpoint
6. User authenticates at IdP
7. IdP redirects to ConductOS callback with authorization code
8. ConductOS exchanges code for tokens
9. ConductOS fetches user info and validates ID token
10. User is provisioned/updated and logged in

---

## SAML 2.0 Configuration

### Service Provider (SP) Information

When configuring your IdP, use the following ConductOS SP information:

| Setting | Value |
|---------|-------|
| **Entity ID** | `https://your-domain.com/api/sso/saml/{provider-id}/metadata` |
| **ACS URL** | `https://your-domain.com/api/sso/saml/{provider-id}/callback` |
| **SLO URL** | `https://your-domain.com/api/sso/saml/{provider-id}/slo` |
| **NameID Format** | `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress` |
| **Binding** | HTTP-POST (ACS), HTTP-Redirect (SLO) |

### Required Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `email` | Yes | User's email address (NameID) |
| `firstName` / `given_name` | Recommended | User's first name |
| `lastName` / `family_name` | Recommended | User's last name |
| `displayName` | Optional | Full display name |
| `groups` | Optional | Group memberships for role mapping |
| `employeeId` | Optional | Employee ID for matching |

### Azure AD / Microsoft Entra ID Setup

1. **Create Enterprise Application**
   - Go to Azure Portal → Azure Active Directory → Enterprise Applications
   - Click "New Application" → "Create your own application"
   - Select "Integrate any other application you don't find in the gallery (Non-gallery)"
   - Name: "KelpHR ConductOS"

2. **Configure SAML Settings**
   - Go to Single Sign-On → SAML
   - Basic SAML Configuration:
     - Identifier (Entity ID): `https://your-domain.com/api/sso/saml/{provider-id}/metadata`
     - Reply URL (ACS): `https://your-domain.com/api/sso/saml/{provider-id}/callback`
     - Sign on URL: `https://your-domain.com/login`
     - Logout URL: `https://your-domain.com/api/sso/saml/{provider-id}/slo`

3. **Configure Attributes & Claims**
   ```
   Required Claims:
   - Unique User Identifier: user.userprincipalname

   Additional Claims:
   - email: user.mail
   - firstName: user.givenname
   - lastName: user.surname
   - displayName: user.displayname
   - department: user.department
   - jobTitle: user.jobtitle
   - groups: user.groups (optional, requires app registration)
   ```

4. **Download Federation Metadata**
   - Download the Federation Metadata XML
   - Or copy: Login URL, Azure AD Identifier, Certificate (Base64)

5. **Assign Users/Groups**
   - Go to Users and Groups
   - Add users or groups that should have access

### Okta Setup

1. **Create SAML Application**
   - Go to Applications → Create App Integration
   - Select SAML 2.0

2. **Configure SAML Settings**
   ```
   Single sign-on URL: https://your-domain.com/api/sso/saml/{provider-id}/callback
   Audience URI (SP Entity ID): https://your-domain.com/api/sso/saml/{provider-id}/metadata
   Name ID format: EmailAddress
   Application username: Email
   ```

3. **Attribute Statements**
   ```
   Name           | Value
   ---------------|------------------
   email          | user.email
   firstName      | user.firstName
   lastName       | user.lastName
   displayName    | user.displayName
   department     | user.department
   groups         | appuser.groups (for group mapping)
   ```

4. **Download IdP Metadata**
   - Go to Sign On tab
   - Download Identity Provider metadata

---

## OpenID Connect Configuration

### Provider Information

| Setting | Value |
|---------|-------|
| **Redirect URI** | `https://your-domain.com/api/sso/oidc/{provider-id}/callback` |
| **Logout Redirect URI** | `https://your-domain.com/api/sso/oidc/{provider-id}/logout-callback` |
| **Scopes** | `openid profile email` |
| **Response Type** | `code` |
| **PKCE** | Enabled (S256) |

### Azure AD / Microsoft Entra ID Setup

1. **Register Application**
   - Go to Azure Portal → Azure Active Directory → App registrations
   - Click "New registration"
   - Name: "KelpHR ConductOS"
   - Supported account types: Select based on your requirements
   - Redirect URI: Web → `https://your-domain.com/api/sso/oidc/{provider-id}/callback`

2. **Configure Authentication**
   - Platform configurations → Web
   - Add logout URL: `https://your-domain.com/api/sso/oidc/{provider-id}/logout-callback`
   - Enable ID tokens

3. **Client Secret**
   - Go to Certificates & secrets
   - Create new client secret
   - Copy the secret value (shown only once)

4. **Collect Configuration**
   ```
   Issuer: https://login.microsoftonline.com/{tenant-id}/v2.0
   Client ID: (from Overview page)
   Client Secret: (from step 3)

   Endpoints (auto-discovered from issuer):
   - Authorization: https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize
   - Token: https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
   - UserInfo: https://graph.microsoft.com/oidc/userinfo
   ```

### Google Workspace Setup

1. **Create OAuth Credentials**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Create OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://your-domain.com/api/sso/oidc/{provider-id}/callback`

2. **Configuration Values**
   ```
   Issuer: https://accounts.google.com
   Client ID: (from credentials)
   Client Secret: (from credentials)
   Scopes: openid email profile
   ```

---

## Just-In-Time Provisioning

JIT provisioning automatically creates user accounts when users authenticate via SSO for the first time.

### Configuration Options

| Setting | Default | Description |
|---------|---------|-------------|
| `jit_enabled` | `true` | Enable automatic user creation |
| `jit_default_role` | `employee` | Default role for new users |
| `jit_update_on_login` | `true` | Update user attributes on each login |
| `jit_auto_activate` | `true` | Automatically activate new accounts |

### Behavior

**First Login (User doesn't exist):**
1. User authenticates via IdP
2. ConductOS creates new user with:
   - Email from IdP assertion
   - Name from IdP attributes
   - Role from group mapping (or default)
   - Organization from SSO provider configuration
3. User is logged in

**Subsequent Logins (User exists):**
1. User authenticates via IdP
2. ConductOS updates user attributes (if `jit_update_on_login` enabled)
3. Role may be updated based on current group membership
4. User is logged in

### Group-to-Role Mapping

Configure group mapping to automatically assign roles based on IdP group membership:

```json
{
  "group_mapping": {
    "ConductOS-Admins": "hr_admin",
    "ConductOS-IC": "ic_member",
    "All-Employees": "employee"
  }
}
```

**Role Priority:** `super_admin` > `hr_admin` > `ic_member` > `employee`

If a user belongs to multiple groups, the highest-priority role is assigned.

---

## SCIM Provisioning

SCIM (System for Cross-domain Identity Management) enables automatic user provisioning and deprovisioning from your identity provider.

### SCIM Endpoint

```
Base URL: https://your-domain.com/api/scim/v2
```

### Supported Operations

| Resource | Create | Read | Update | Delete |
|----------|--------|------|--------|--------|
| /Users | ✅ | ✅ | ✅ | ✅ |
| /Groups | ✅ | ✅ | ✅ | ✅ |

### Authentication

SCIM endpoints use Bearer token authentication:
```
Authorization: Bearer {scim-token}
```

Generate a SCIM token in: Admin → SSO Settings → SCIM Configuration

### Azure AD SCIM Setup

1. Go to Enterprise Application → Provisioning
2. Select "Automatic" provisioning mode
3. Admin Credentials:
   - Tenant URL: `https://your-domain.com/api/scim/v2`
   - Secret Token: (from ConductOS admin)
4. Test Connection
5. Configure Attribute Mappings
6. Enable Provisioning

---

## Attribute Mapping

### Standard Mappings

ConductOS automatically maps common attribute names:

| ConductOS Field | SAML Attributes | OIDC Claims |
|-----------------|-----------------|-------------|
| `email` | email, emailAddress, mail | email |
| `first_name` | firstName, givenName, given_name | given_name |
| `last_name` | lastName, surname, sn, family_name | family_name |
| `display_name` | displayName, name, cn | name |
| `employee_id` | employeeId, employeeNumber | employee_id |
| `department` | department | department |
| `job_title` | title, jobTitle | job_title |
| `groups` | groups, memberOf | groups |

### Custom Mapping

Configure custom attribute mapping in the provider settings:

```json
{
  "attribute_mapping": {
    "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "first_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
    "last_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
    "employee_id": "customAttribute123"
  }
}
```

---

## Security Features

### Encryption & Signing

| Feature | SAML | OIDC |
|---------|------|------|
| Request Signing | ✅ SHA-256 | N/A |
| Response Validation | ✅ | ✅ |
| Assertion Encryption | Optional | N/A |
| Token Encryption | N/A | JWE Support |
| PKCE | N/A | ✅ S256 |

### Security Configuration

```json
{
  "saml_signature_algorithm": "sha256",
  "saml_digest_algorithm": "sha256",
  "saml_want_assertions_signed": true,
  "saml_want_response_signed": true,
  "oauth_pkce_enabled": true
}
```

### Session Management

- **Session Duration**: Configurable (default: 8 hours)
- **Force Re-authentication**: Optional for sensitive operations
- **Single Logout (SLO)**: Supported for SAML
- **Token Refresh**: Automatic for OIDC

### Domain Verification

Before enabling SSO, organizations must verify domain ownership:

1. **DNS TXT Verification**
   - Add TXT record: `conductos-verify={token}`
   - Wait for DNS propagation
   - Click Verify

2. **Manual Verification**
   - For enterprise customers with dedicated support
   - Contact support@conductos.app

---

## Admin Configuration

### ConductOS Admin Portal

1. **Navigate to SSO Settings**
   - Admin Dashboard → Organization Settings → SSO

2. **Add Identity Provider**
   - Click "Add Provider"
   - Select provider type (SAML or OIDC)
   - Select vendor (Okta, Azure AD, etc.)
   - Enter configuration details

3. **Configure Provider**
   - Upload IdP metadata (SAML) or enter OIDC endpoints
   - Configure attribute mapping
   - Configure group-to-role mapping
   - Set JIT provisioning options

4. **Verify Domain**
   - Add your corporate domain
   - Complete verification

5. **Activate Provider**
   - Test with a pilot user
   - Activate for all users

6. **Enforce SSO (Optional)**
   - Enable "Require SSO" to disable password login
   - Configure bypass for emergency access

### API Configuration

Providers can also be configured via API:

```bash
# Create provider
curl -X POST https://your-domain.com/api/admin/sso/providers \
  -H "Authorization: Bearer {admin-token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "corporate-okta",
    "display_name": "Corporate SSO",
    "provider_type": "saml",
    "provider_vendor": "okta",
    "saml_sso_url": "https://company.okta.com/app/xxx/sso/saml",
    "saml_certificate": "MIIC...",
    "jit_enabled": true,
    "jit_default_role": "employee"
  }'
```

---

## Troubleshooting

### Common Issues

#### SAML: "Invalid Signature"
- Verify the certificate is correctly uploaded
- Check certificate hasn't expired
- Ensure correct certificate is being used (signing cert, not encryption)

#### SAML: "Audience Mismatch"
- Verify Entity ID matches exactly in IdP configuration
- Check for trailing slashes

#### OIDC: "Invalid Client"
- Verify client ID and secret
- Check redirect URI is exactly registered

#### OIDC: "Invalid State"
- User took too long to authenticate (> 10 minutes)
- Browser cookies may be blocked

#### JIT: "User Not Found"
- Check domain is verified
- Verify email attribute is being sent
- Check attribute mapping configuration

### Debug Mode

Enable debug logging (development only):
```
SSO_DEBUG=true
```

### Audit Log

All SSO events are logged. Check the SSO Audit Log for:
- Login attempts (success/failure)
- User provisioning events
- Configuration changes
- Session events

Access via: Admin → SSO Settings → Audit Log

### Support

For enterprise support:
- Email: support@conductos.app
- Documentation: https://docs.conductos.app/sso
- Status: https://status.conductos.app

---

## API Reference

### SSO Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sso/providers` | GET | Check SSO availability for email |
| `/api/sso/saml/{id}/login` | GET | Initiate SAML login |
| `/api/sso/saml/{id}/callback` | POST | SAML ACS endpoint |
| `/api/sso/saml/{id}/metadata` | GET | SP metadata XML |
| `/api/sso/saml/{id}/slo` | ALL | Single Logout |
| `/api/sso/oidc/{id}/login` | GET | Initiate OIDC login |
| `/api/sso/oidc/{id}/callback` | GET | OIDC callback |
| `/api/sso/logout` | POST | Logout |
| `/api/sso/session/validate` | GET | Validate session |

### Admin API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/sso/providers` | GET | List providers |
| `/api/admin/sso/providers` | POST | Create provider |
| `/api/admin/sso/providers/{id}` | GET | Get provider details |
| `/api/admin/sso/providers/{id}` | PUT | Update provider |
| `/api/admin/sso/providers/{id}/activate` | POST | Activate provider |
| `/api/admin/sso/providers/{id}/deactivate` | POST | Deactivate provider |
| `/api/admin/sso/domains` | GET | List domains |
| `/api/admin/sso/domains` | POST | Add domain |
| `/api/admin/sso/domains/{id}/verify` | POST | Verify domain |
| `/api/admin/sso/settings` | GET | Get org SSO settings |
| `/api/admin/sso/settings` | PUT | Update org SSO settings |
| `/api/admin/sso/audit-log` | GET | Get audit log |
| `/api/admin/sso/scim/generate-token` | POST | Generate SCIM token |

---

## Compliance & Certifications

ConductOS SSO integration is designed to meet enterprise compliance requirements:

- **SOC 2 Type II**: Audited security controls
- **GDPR**: Data protection compliant
- **ISO 27001**: Information security management
- **HIPAA**: Healthcare data protection ready
- **PoSH Act 2013**: Indian workplace harassment compliance

### Data Handling

- SSO tokens are encrypted at rest
- Session data is encrypted in transit (TLS 1.3)
- Audit logs retained for 7 years
- PII minimization in logging

---

*For additional support or custom integration requirements, contact enterprise@conductos.app*
