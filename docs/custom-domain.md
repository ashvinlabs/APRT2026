# Guide: Setting Up Custom Domain with Cloudflare & Vercel

Follow these steps to point `pemilurt12.ashvinlabs.com` to your APRT2026 application.

## 1. Vercel Configuration (Project Level)

> [!IMPORTANT]
> Make sure you are inside your **APRT2026 project** on the VERCEL dashboard, NOT in your account settings.

1. Go to your **Vercel Dashboard** and click on the **APRT2026** project.
2. In the top navigation bar of the project (below the project name), click the **Domains** tab (it should be at the same level as **Settings** and **Deployments**).
3. Click the **Add** button.
4. Enter `pemilurt12.ashvinlabs.com` and click **Add**.
5. Vercel will show that the domain is "Invalid Configuration". Keep this page open; you will need the CNAME value (usually `cname.vercel-dns.com`).

## 2. Cloudflare DNS Configuration

1. Log in to your **Cloudflare Dashboard**.
2. Select the `ashvinlabs.com` domain.
3. Go to **DNS > Records**.
4. Click **Add Record**:
   - **Type**: `CNAME`
   - **Name**: `pemilurt12`
   - **Target**: `cname.vercel-dns.com`
   - **Proxy status**: `Proxied` (Orange cloud) or `DNS only` (Grey cloud).
     - *Note: If using Vercel, it is often recommended to use "DNS only" initially to let Vercel handle the SSL certificate generation, then you can switch to "Proxied" if you want Cloudflare's security features.*
5. Click **Save**.

## 3. Update Supabase Configuration

Once the domain is active (this can take a few minutes):

1. Go to your **Supabase Dashboard**.
2. Navigate to **Authentication > URL Configuration** (Person icon in sidebar).
3. Update **Site URL**:
   - Change it to `https://pemilurt12.ashvinlabs.com`
4. Update **Redirect URLs**:
   - Add `https://pemilurt12.ashvinlabs.com/**`
   - Add `https://pemilurt12.ashvinlabs.com/reset-password`

## 4. Update Email Configuration (Optional)

If you are using Resend:
1. Update your **Sender Email** in [email-setup.md](file:///g:/Work/ashvinlabs/repos/APRT2026/docs/email-setup.md) to use the new domain if desired (e.g., `info@aprt12-2026.ashvinlabs.com`), but this requires verifying the subdomain in Resend as well.
2. It's usually easier to keep using a verified root domain email like `aprt@ashvinlabs.com`.
