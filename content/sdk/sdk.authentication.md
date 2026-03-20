# Authentication

> How to authenticate SDK requests — publishable keys for public dashboards, token exchange for multi-tenant apps.

## Publishable keys

Publishable keys (`bon_pk_...`) are safe to use in client-side code — HTML pages, browser apps, mobile apps. They grant read-only access to your org's semantic layer.

```javascript
const bon = Bonnard.createClient({
  apiKey: "bon_pk_...",
});
```

Create publishable keys in the Bonnard web app under **Settings > API Keys**.

**What publishable keys can do:**

- Query measures and dimensions
- Explore schema (views, fields)

**What they cannot do:**

- Modify data or schema
- Access other orgs' data

Publishable keys inherit the governance context of the user who created them — the key sees exactly what that user sees. If the creator belongs to the "Sales" group and can only see sales-related views and fields, the publishable key has the same restrictions. If no governance is configured, the key has full read access.

## Token exchange (multi-tenant)

For B2B apps where each customer should only see their own data, use **secret key token exchange**. Your server exchanges a secret key for a short-lived JWT with a security context and optional group restrictions, then your frontend queries with that token.

### Server-side: exchange secret key for scoped token

```javascript
// Your backend (Node.js, Python, etc.)
const res = await fetch("https://app.bonnard.dev/api/sdk/token", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.BONNARD_SECRET_KEY}`, // bon_sk_...
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    groups: ["analysts"], // optional — restrict to specific governance groups
    security_context: {
      tenant_id: currentCustomer.id, // your tenant identifier
    },
  }),
});

const { token } = await res.json();
// Pass this token to your frontend
```

### Client-side: query with scoped token

```javascript
const bon = Bonnard.createClient({
  fetchToken: async () => {
    const res = await fetch("/my-backend/bonnard-token");
    const { token } = await res.json();
    return token;
  },
});

const { data } = await bon.query({
  measures: ["orders.revenue"],
  dimensions: ["orders.status"],
});
// Only returns rows matching the tenant's security context
```

### How token refresh works

The SDK automatically:

1. Calls `fetchToken()` on the first query
2. Caches the returned JWT
3. Parses the JWT `exp` claim
4. Refreshes 60 seconds before expiry by calling `fetchToken()` again

You don't need to manage token lifecycle — just provide the `fetchToken` callback.

### Groups and governance

The optional `groups` parameter restricts the token to specific governance groups configured in the dashboard. This controls which views and fields the token can access:

```javascript
body: JSON.stringify({
  groups: ["analysts"], // only sees views/fields the "analysts" group can access
  security_context: { tenant_id: "acme" },
});
```

All SDK tokens automatically include the `sdk` group, which matches `group: sdk` entries in your access_policy YAML. If `groups` is omitted, the token carries `["sdk"]` only. If provided, the named groups are added alongside `sdk` and validated against your org's governance configuration — unknown group names return an error.

### Security context

The `security_context` object you pass during token exchange becomes available in your Cube models as `{securityContext.attrs.*}`. Use it in access policies to enforce row-level security:

```yaml
# In your Cube view definition
access_policy:
  - group: sdk
    row_level:
      filters:
        - member: tenant_id
          operator: equals
          values:
            - "{securityContext.attrs.tenant_id}"
```

You can combine `groups` (field-level access) with `security_context` (row-level filtering) in the same token exchange.

See [access-control.security-context](access-control.security-context) for the full setup guide.

## Browser HTML with token exchange

For HTML dashboards that need multi-tenant auth, your page fetches a token from your backend:

```html
<script src="https://cdn.jsdelivr.net/npm/@bonnard/sdk/dist/bonnard.iife.js"></script>
<script>
  const bon = Bonnard.createClient({
    fetchToken: async () => {
      const res = await fetch("/api/bonnard-token");
      const { token } = await res.json();
      return token;
    },
  });

  (async () => {
    const { data } = await bon.query({
      measures: ["orders.revenue"],
    });
    // Data is scoped to the authenticated tenant
  })();
</script>
```

## When to use which

| Scenario                                           | Auth method         | Key type           |
| -------------------------------------------------- | ------------------- | ------------------ |
| Internal dashboard (your team)                     | Publishable key     | `bon_pk_...`       |
| Public dashboard (anyone can view)                 | Publishable key     | `bon_pk_...`       |
| Embedded analytics (customer sees their data only) | Token exchange      | `bon_sk_...` → JWT |
| Server-side data pipeline                          | Secret key directly | `bon_sk_...`       |

## Error handling

Authentication errors throw a `BonnardError` with `statusCode: 401`:

```typescript
import { BonnardError } from "@bonnard/sdk";

try {
  const { data } = await bon.query({ measures: ["orders.revenue"] });
} catch (err) {
  if (err instanceof BonnardError && err.statusCode === 401) {
    // Redirect to login or refresh token
  }
}
```

If `groups` in a token exchange request includes an unknown group name, the API returns a `400` error. See [sdk.errors](sdk.errors) for the full error reference.

## See also

- [sdk.browser](sdk.browser) — Browser / CDN quickstart
- [sdk.query-reference](sdk.query-reference) — Full query API
- [sdk.errors](sdk.errors) — Error handling, status codes, and retry patterns
- [access-control.security-context](access-control.security-context) — Row-level security setup
