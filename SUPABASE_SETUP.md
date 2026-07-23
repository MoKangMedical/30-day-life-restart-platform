# NewLife30 Account And Cloud Progress Setup

The web app is ready for Supabase phone OTP login and user-scoped progress sync. It intentionally does not ship any secret, project URL, or service-role credential.

## Required production configuration

1. Create or select a Supabase project in an organization you control.
2. Apply `supabase/migrations/20260723173000_create_user_progress.sql`.
3. Enable phone authentication and connect an approved SMS provider in the Supabase Auth settings.
4. Add `https://newlife30.cn` and the required callback URLs to the Auth redirect allow-list.
5. Put the project URL and publishable key in the hosting environment using the names in `.env.example`, then rebuild and deploy the site.
6. Create a server-side WeChat OAuth route, configure its public start URL as `VITE_WECHAT_AUTH_START_URL`, and keep the WeChat AppSecret only on that server.

## WeChat Mini Program reminders

The mini program includes the `wx.requestSubscribeMessage` integration point. Before it can send reminders, add approved template IDs and the production API base URL in `wechat-miniprogram/utils/cloud.js`, configure request domains in the WeChat console, and connect the mini-program `wx.login` code exchange to the same account service.

## Security boundary

- Browser code uses only the Supabase publishable key.
- The migration enables RLS and restricts each row to its authenticated owner.
- A WeChat AppSecret, SMS provider secret, and Supabase service-role key must never be committed or exposed to the browser.
