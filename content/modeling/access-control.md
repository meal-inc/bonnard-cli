# Access Control

> Control who can see what — for internal teams via the dashboard, or for your customers via the SDK.

Bonnard supports two access control models that can be used independently or together:

**[Governance](access-control.governance)** — Manage access for internal teams from the dashboard. Control which views, fields, and rows each group can see. No code changes required.

**[Security Context](access-control.security-context)** — Isolate data for your customers in B2B apps. Your server exchanges a token with tenant attributes, and row-level filters are enforced automatically on every SDK query.

Both models are merged at query time. You can run governance for your internal teams and security context for your customers on the same views.
