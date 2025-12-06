# SSO Quick Start Guide

## Get Started with ConductOS SSO in 15 Minutes

This guide walks you through setting up SSO for your organization quickly.

---

## Prerequisites

- Admin access to ConductOS
- Admin access to your Identity Provider (Azure AD, Okta, Google, etc.)
- Your corporate email domain (e.g., `company.com`)

---

## Step 1: Verify Your Domain (5 minutes)

1. Log in to ConductOS as an admin
2. Navigate to **Admin → Organization Settings → SSO**
3. Click **"Add Domain"**
4. Enter your corporate domain (e.g., `company.com`)
5. Copy the verification TXT record:
   ```
   conductos-verify=abc123xyz789
   ```
6. Add this TXT record to your DNS
7. Wait a few minutes and click **"Verify"**

---

## Step 2: Configure Your Identity Provider

### For Microsoft Azure AD / Entra ID

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory → Enterprise Applications**
3. Click **"New Application" → "Create your own application"**
4. Select **"Non-gallery"**, name it "KelpHR ConductOS"
5. Go to **Single Sign-On → SAML**
6. Enter these values:
   - **Entity ID**: `https://your-app.conductos.app/api/sso/saml/PROVIDER_ID/metadata`
   - **Reply URL**: `https://your-app.conductos.app/api/sso/saml/PROVIDER_ID/callback`
7. Download the **Federation Metadata XML**

### For Okta

1. Go to Okta Admin Console
2. Navigate to **Applications → Create App Integration**
3. Select **SAML 2.0**
4. Enter these values:
   - **Single sign-on URL**: `https://your-app.conductos.app/api/sso/saml/PROVIDER_ID/callback`
   - **Audience URI**: `https://your-app.conductos.app/api/sso/saml/PROVIDER_ID/metadata`
5. Download the **Identity Provider Metadata**

### For Google Workspace

1. Go to [Google Admin Console](https://admin.google.com)
2. Navigate to **Apps → Web and mobile apps → Add app → Add custom SAML app**
3. Enter these values:
   - **ACS URL**: `https://your-app.conductos.app/api/sso/saml/PROVIDER_ID/callback`
   - **Entity ID**: `https://your-app.conductos.app/api/sso/saml/PROVIDER_ID/metadata`
4. Download the **IdP metadata**

---

## Step 3: Add Provider in ConductOS (3 minutes)

1. In ConductOS Admin, go to **SSO Settings → Add Provider**
2. Select your identity provider type (SAML 2.0)
3. Select your vendor (Azure AD, Okta, Google, etc.)
4. Upload the metadata file you downloaded
5. Or manually enter:
   - **SSO URL**: From your IdP
   - **Certificate**: From your IdP
6. Click **"Create Provider"**

---

## Step 4: Configure Attribute Mapping (2 minutes)

In the provider settings, verify attribute mapping:

| ConductOS Field | Your IdP Attribute |
|-----------------|-------------------|
| Email | email / emailAddress |
| First Name | firstName / givenname |
| Last Name | lastName / surname |

For Azure AD, the default mappings usually work automatically.

---

## Step 5: Test SSO (2 minutes)

1. Open an incognito/private browser window
2. Go to your ConductOS login page
3. Enter your corporate email
4. You should see **"Sign in with [Your Provider]"**
5. Click the button and authenticate
6. Verify you're logged in successfully

---

## Step 6: Activate for All Users (1 minute)

Once testing is successful:

1. Go to **SSO Settings → Your Provider**
2. Click **"Activate"**
3. Optionally, enable **"Require SSO"** to disable password login

---

## Quick Reference

### ConductOS SP Information

```
Entity ID:     https://your-app.conductos.app/api/sso/saml/{provider-id}/metadata
ACS URL:       https://your-app.conductos.app/api/sso/saml/{provider-id}/callback
SLO URL:       https://your-app.conductos.app/api/sso/saml/{provider-id}/slo
NameID Format: urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress
```

### Required Attributes

| Attribute | Required | Notes |
|-----------|----------|-------|
| email | Yes | User's corporate email |
| firstName | Recommended | User's first name |
| lastName | Recommended | User's last name |

---

## Common Issues

### "SSO provider not found"
- Verify your domain is verified
- Check the provider is activated

### "Invalid signature"
- Re-download and re-upload the IdP certificate

### "User not provisioned"
- Check JIT provisioning is enabled
- Verify email attribute is being sent

---

## Need Help?

- Full documentation: [SSO Integration Guide](./SSO_INTEGRATION_GUIDE.md)
- Support: support@conductos.app

---

*Ready to go! Your users can now sign in with their corporate credentials.*
