# Guide: Supabase Email Configuration

The Password Reset and User Invitation features rely on Supabase's internal Auth system. By default, Supabase has a rate limit and uses a shared email provider. For production, you must configure your own SMTP or verify your setup.

## 1. Configure Email Templates

1. Go to your **Supabase Dashboard**.
2. Click on the **Authentication** tab (Person icon) in the left sidebar.
3. Under **Configuration**, click on **Email Templates**.
4. **Reset Password**:
    - Ensure the "Message" contains `{{ .ConfirmationURL }}`.
5. **Confirm Signup**: (If using verification)
    - Ensure it is enabled if you want users to verify email before login.

## 2. Configure Site URL & Redirects

1. Go to the **Authentication** tab (Person icon) in the left sidebar.
2. Under **Configuration**, click on **URL Configuration**.
3. Set the **Site URL** to `https://pemilurt12.ashvinlabs.com`.
4. Add `https://pemilurt12.ashvinlabs.com/**` to the **Redirect URLs** list.
5. **CRITICAL**: Also specifically add `https://pemilurt12.ashvinlabs.com/reset-password` to the **Redirect URLs**. This ensures the recovery link brings you directly to the correct page with the session token intact.

## 3. Set Up Custom SMTP (Resend)

1. Click on the **Project Settings** (Gear icon) at the very bottom of the left sidebar.
2. Click on **Authentication** in the settings menu.
3. Scroll down to **SMTP Settings**.
4. Enable **SMTP**.
5. Fill in the following values from your **Resend Dashboard**:
    - **Sender Email**: (Must be a verified domain on Resend, e.g., `noreply@yourdomain.com`)
    - **Sender Name**: `Panitia APRT2026`
    - **Host**: `smtp.resend.com`
    - **Port**: `587`
    - **User**: `resend`
    - **Pass**: (Your Resend API Key, e.g., `re_abc123...`)
6. Click **Save**.

## 4. Troubleshooting Resend

- **Domain Verification**: Ensure your domain is verified in the [Resend Domains](https://resend.com/domains) section.
- **API Key Permissions**: The API key must have "Full Access" or "Sending" permissions.
- **Port**: If `587` doesn't work, try `465` (this is the most stable port for Supabase -> Resend).

## 5. Troubleshooting: "Email link is invalid or has expired"

If you see `error_code=otp_expired` when clicking the link, it is usually because **Gmail/Outlook security scanners** "click" the link before you do to check for viruses. Since the link is one-time use, it expires for you.

**How to fix:**
1. Go to **Supabase Dashboard > Authentication > Configuration**.
2. Click on **Security and Metadata**.
3. Under **Email Flow**, find **Time to live (seconds)** for email links.
4. Increase this to a higher value (e.g., `86400` for 24 hours).
5. **Invite the user again** (The old link is already dead).

> [!IMPORTANT]
> Without the correct **Site URL** and **Redirect URLs**, the recovery link in the email will not redirect the user back to the `/reset-password` page correctly.
