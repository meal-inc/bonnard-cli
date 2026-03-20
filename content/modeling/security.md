# Security

> How Bonnard protects your data — encryption, access control, multi-tenancy, and infrastructure compliance.

Bonnard connects to your data warehouse, executes queries on your behalf, and delivers results to your team or your customers. We take the trust that requires seriously. This page describes how we protect your data at every layer.

## Credential Protection

Your warehouse credentials (passwords, private keys, connection strings) are the most sensitive data we handle.

- **Encrypted at rest** with AES-256-GCM using JWE (JSON Web Encryption). Credentials are encrypted before they reach the database and stored as opaque blobs.
- **Never returned via API.** No API endpoint, SDK response, or dashboard view will ever expose your credentials. Configuration details (host, database, schema) are displayed separately.
- **Decrypted only in memory** for the duration of a single query execution. Credentials are never written to disk, logs, or temporary storage.

## Multi-Tenant Isolation

Every customer's data is isolated at the database level using PostgreSQL Row-Level Security (RLS).

- All customer-facing tables enforce RLS policies scoped to your organisation ID.
- Even if application code has a bug, the database layer prevents cross-organisation data access.
- RLS policies are enforced on every query — there is no way to bypass them from the application layer.

For B2B use cases where your own customers need isolated access, Bonnard supports [access-control.security-context](access-control.security-context) — a token exchange pattern that attaches tenant attributes to every query automatically.

## API Key Security

Bonnard uses a layered key system designed so that no single credential grants broad access:

- **Publishable keys** (`bon_pk_`) are restricted to read-only query access and are safe to use in client-side code. Each key inherits the governance context of the user who created it — the key sees exactly what that user sees.
- **Secret keys** (`bon_sk_`) cannot query directly. They must be exchanged server-side for a short-lived JWT token (15 minutes by default, configurable from 60 seconds to 1 hour). The exchange accepts optional `groups` and `security_context` parameters to scope the token.
- **All keys are stored as SHA-256 hashes.** The plaintext is shown once at creation and is never retrievable afterward.
- Keys can be revoked instantly from the dashboard.

## Encryption in Transit

All communication with Bonnard services is encrypted with TLS. HTTPS is enforced across the web application, API endpoints, Cube query engine, and MCP server. There is no option to connect over unencrypted HTTP.

## Authentication & Access Control

User authentication is handled by [Clerk](https://clerk.com), which provides:

- Multi-factor authentication (MFA)
- Configurable password policies
- Organisation-based role management (owner, admin, member)

Within Bonnard, admin-only actions (managing data sources, deploying schemas, configuring governance) are enforced at both the API and database layer. See [access-control.governance](access-control.governance) for details on field-level and row-level access policies.

## Infrastructure & Compliance

Bonnard's infrastructure is hosted on providers with established security certifications:

| Provider | Role                      | SOC 2 Type II |
| -------- | ------------------------- | :-----------: |
| Supabase | Database (PostgreSQL)     |       ✓       |
| Vercel   | Web application & API     |       ✓       |
| Fly.io   | Query engine & MCP server |       ✓       |
| Clerk    | Authentication            |       ✓       |
| AWS (S3) | Object storage            |       ✓       |

Bonnard is currently pursuing SOC 2 Type II certification. Contact us at [alex@bonnard.dev](mailto:alex@bonnard.dev) to request details on our security posture or to receive our report once available.

## Responsible Disclosure

If you discover a security vulnerability in Bonnard, we want to hear about it.

- **Report to:** [alex@bonnard.dev](mailto:alex@bonnard.dev)
- **Acknowledgment:** within 2 business days
- **Initial assessment:** within 5 business days

We will not take legal action against researchers who act in good faith. We ask that you do not access or modify customer data, and that you do not publicly disclose vulnerabilities before we have had reasonable time to address them.
