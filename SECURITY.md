# Security Controls

This project includes application and operational controls intended to support production security reviews.

## Application controls

- Admin routes are protected by authentication in [proxy.ts](./proxy.ts).
- Optional IP allowlisting is supported with `ADMIN_ALLOWED_IPS`.
- Optional extra Basic authentication is supported with `ADMIN_BASIC_AUTH_USERNAME` and `ADMIN_BASIC_AUTH_PASSWORD`.
- Login and sensitive API routes are rate-limited in:
  - [app/auth/callback/route.ts](./app/auth/callback/route.ts)
  - [app/api/billing/checkout/route.ts](./app/api/billing/checkout/route.ts)
  - [app/api/billing/portal/route.ts](./app/api/billing/portal/route.ts)
  - [app/api/prototype/chat/route.ts](./app/api/prototype/chat/route.ts)
  - [app/api/prototype/crawl/route.ts](./app/api/prototype/crawl/route.ts)
  - [app/api/prototype/reset/route.ts](./app/api/prototype/reset/route.ts)
  - [app/api/prototype/state/route.ts](./app/api/prototype/state/route.ts)
- Same-origin checks are enforced for state-changing internal APIs in [lib/security.ts](./lib/security.ts).
- Security headers are configured in [next.config.ts](./next.config.ts), including CSP, HSTS, X-Frame-Options, Referrer-Policy, and X-Content-Type-Options.
- Sensitive runtime data is not stored in the public directory.

## Continuous security checks

- GitHub Actions workflow [Security Checks](./.github/workflows/security-checks.yml)
  - runs lint and production build checks
  - runs `npm audit --omit=dev --audit-level=high`
  - runs on push, pull request, manual dispatch, and weekly schedule
- GitHub Actions workflow [CodeQL](./.github/workflows/codeql.yml)
  - scans the codebase for JavaScript/TypeScript security issues
  - runs on push, pull request, manual dispatch, and weekly schedule
- Dependabot configuration [dependabot.yml](./.github/dependabot.yml)
  - checks npm dependencies weekly
  - checks GitHub Actions updates weekly

## Required production configuration

To enforce admin access restrictions in production, configure at least one of the following in Vercel:

```env
ADMIN_ALLOWED_IPS=203.0.113.10,198.51.100.8
ADMIN_BASIC_AUTH_USERNAME=admin
ADMIN_BASIC_AUTH_PASSWORD=replace-with-a-strong-random-password
```

## Operational items outside the codebase

The following controls still require operational setup and cannot be fully guaranteed by code alone:

- Enabling MFA for administrator accounts in Google/Supabase/Vercel/Stripe
- Periodic review of GitHub Actions security findings and dependency alerts
- Malware protection on administrator devices
- Independent penetration testing if required by policy or partner review
