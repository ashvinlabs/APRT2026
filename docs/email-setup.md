# Guide: Supabase Email Configuration

The Password Reset and User Invitation features rely on Supabase's internal Auth system. By default, Supabase has a rate limit and uses a shared email provider. For production, you must configure your own SMTP or verify your setup.

## 1. Configure Email Templates

1. Go to your **Supabase Dashboard**.
2. Navigate to **Authentication** -> **Email Templates**.
3. **Reset Password**:
    - Ensure the "Message" contains `{{ .ConfirmationURL }}`.
    - The link in our application points to `/reset-password`.
4. **Confirm Signup**: (If using verification)
    - Ensure it is enabled if you want users to verify email before login.

## 2. Set Up Custom SMTP (Recommended)

1. Go to **Project Settings** -> **Auth**.
2. Scroll to **SMTP Settings**.
3. Enable **SMTP**.
4. Enter your provider details (e.g., SendGrid, Resend, Postmark, or Gmail).
    - **Sender email**: e.g., `noreply@yourdomain.com`
    - **Host**: e.g., `smtp.resend.com`
    - **Port**: `587`
    - **Username & Password**: Provided by your service.

## 3. Configure Site URL

1. Go to **Project Settings** -> **Auth**.
2. Set the **Site URL** to your production domain (or your local dev URL during testing, e.g., `http://localhost:3000`).
3. Add `**` to **Redirect URLs** or specifically `${SITE_URL}/reset-password`.

> [!IMPORTANT]
> Without the correct **Site URL** and **Redirect URLs**, the recovery link in the email will not redirect the user back to the `/reset-password` page correctly.
