# Authentication

> How to authenticate SDK requests — publishable keys for public dashboards, token exchange for multi-tenant apps.

## Publishable keys

Publishable keys (`bon_pk_...`) are safe to use in client-side code — HTML pages, browser apps, mobile apps. They grant read-only access to your org's semantic layer.

```javascript
const bon = Bonnard.createClient({
  apiKey: 'bon_pk_...',
});
```

Create publishable keys in the Bonnard web app under **Settings > API Keys**.

**What publishable keys can do:**
- Query measures and dimensions
- Explore schema (views, fields)

**What they cannot do:**
- Modify data or schema
- Access other orgs' data
- Bypass governance policies (if configured at org level)

## Token exchange (multi-tenant)

For B2B apps where each customer should only see their own data, use **secret key token exchange**. Your server exchanges a secret key for a short-lived JWT with a security context, then your frontend queries with that token.

### Server-side: exchange secret key for scoped token

```javascript
// Your backend (Node.js, Python, etc.)
const res = await fetch('https://app.bonnard.dev/api/sdk/token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.BONNARD_SECRET_KEY}`, // bon_sk_...
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
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
    const res = await fetch('/my-backend/bonnard-token');
    const { token } = await res.json();
    return token;
  },
});

const { data } = await bon.query({
  measures: ['orders.revenue'],
  dimensions: ['orders.status'],
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

### Security context and governance

The `security_context` object you pass during token exchange becomes available in your Cube models as `{securityContext.attrs.*}`. Use it in access policies to enforce row-level security:

```yaml
# In your Cube view definition
access_policy:
  - role: "*"
    conditions:
      - sql: "{TABLE}.tenant_id = '{securityContext.attrs.tenant_id}'"
```

See [security-context](security-context) for the full governance setup guide.

## Browser HTML with token exchange

For HTML dashboards that need multi-tenant auth, your page fetches a token from your backend:

```html
<script src="https://cdn.jsdelivr.net/npm/@bonnard/sdk/dist/bonnard.iife.js"></script>
<script>
  const bon = Bonnard.createClient({
    fetchToken: async () => {
      const res = await fetch('/api/bonnard-token');
      const { token } = await res.json();
      return token;
    },
  });

  (async () => {
    const { data } = await bon.query({
      measures: ['orders.revenue'],
    });
    // Data is scoped to the authenticated tenant
  })();
</script>
```

## When to use which

| Scenario | Auth method | Key type |
|----------|------------|----------|
| Internal dashboard (your team) | Publishable key | `bon_pk_...` |
| Public dashboard (anyone can view) | Publishable key | `bon_pk_...` |
| Embedded analytics (customer sees their data only) | Token exchange | `bon_sk_...` → JWT |
| Server-side data pipeline | Secret key directly | `bon_sk_...` |

## See also

- [sdk.browser](sdk.browser) — Browser / CDN quickstart
- [sdk.query-reference](sdk.query-reference) — Full query API
- [security-context](security-context) — Row-level security setup
