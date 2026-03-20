# Error Handling

> How to catch, inspect, and handle errors from the Bonnard SDK.

## BonnardError

All API errors thrown by the SDK are instances of `BonnardError`, which extends `Error` with the HTTP status code from the response. This lets you distinguish between auth failures, bad requests, rate limits, and server errors.

```typescript
import { createClient, BonnardError } from "@bonnard/sdk";

const bon = createClient({ apiKey: "bon_pk_..." });

try {
  const { data } = await bon.query({
    measures: ["orders.revenue"],
  });
} catch (err) {
  if (err instanceof BonnardError) {
    console.log(err.message); // human-readable error message
    console.log(err.statusCode); // HTTP status code (401, 400, 500, etc.)
    console.log(err.retryable); // true for 429 and 5xx errors
  }
}
```

### Properties

| Property     | Type      | Description                                                     |
| ------------ | --------- | --------------------------------------------------------------- |
| `message`    | `string`  | Human-readable error description                                |
| `statusCode` | `number`  | HTTP status code from the API response                          |
| `retryable`  | `boolean` | `true` if the error is a rate limit (429) or server error (5xx) |
| `name`       | `string`  | Always `"BonnardError"`                                         |

## Status codes

| Code          | Meaning        | Retryable | Common cause                                                                |
| ------------- | -------------- | --------- | --------------------------------------------------------------------------- |
| `400`         | Bad request    | No        | Invalid query — unknown field name, bad filter, missing measures/dimensions |
| `401`         | Unauthorized   | No        | Invalid, expired, or missing API key / token                                |
| `403`         | Forbidden      | No        | Key doesn't have access to the requested view or field (governance)         |
| `404`         | Not found      | No        | Endpoint doesn't exist or resource not found                                |
| `429`         | Rate limited   | Yes       | Too many requests — back off and retry                                      |
| `500`         | Server error   | Yes       | Internal error — retry or contact support                                   |
| `502` / `503` | Upstream error | Yes       | Warehouse or Cube service temporarily unavailable                           |

## Retry pattern

The `retryable` property makes it easy to implement automatic retry with exponential backoff:

```typescript
async function queryWithRetry(
  bon: ReturnType<typeof createClient>,
  options: Parameters<typeof bon.query>[0],
  maxRetries = 3,
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await bon.query(options);
    } catch (err) {
      if (err instanceof BonnardError && err.retryable && attempt < maxRetries) {
        const delay = 1000 * 2 ** attempt; // 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}
```

## Common errors and fixes

### "Unauthorized"

```
BonnardError: Unauthorized (statusCode: 401)
```

- **Publishable key**: check the key starts with `bon_pk_` and hasn't been revoked in Settings > API Keys
- **Token exchange**: your `fetchToken` callback may be returning an expired or malformed JWT — the SDK refreshes tokens automatically, but your backend endpoint must return a valid token
- **Secret key server-side**: check the key starts with `bon_sk_` and is set correctly in your environment

### "Query failed"

```
BonnardError: Query failed (statusCode: 400)
```

- Field names must be fully qualified: `orders.revenue`, not `revenue`
- The field must exist in a deployed view — run `bon.explore()` to check available fields
- Filter operators must match the field type (e.g. `gt` for numbers, `contains` for strings)
- Time dimensions must reference a field with `type: time`

### Network errors

Network failures (DNS, timeout, CORS) throw a standard `TypeError`, not a `BonnardError`:

```typescript
try {
  const { data } = await bon.query({ measures: ["orders.revenue"] });
} catch (err) {
  if (err instanceof BonnardError) {
    // API responded with an error status
  } else {
    // Network failure — no response received
    console.error("Network error:", err.message);
  }
}
```

For browser apps, ensure your domain is allowed in your Bonnard dashboard CORS settings.

## Browser / CDN usage

In the browser IIFE bundle, `BonnardError` is available on `window.Bonnard`:

```html
<script src="https://cdn.jsdelivr.net/npm/@bonnard/sdk/dist/bonnard.iife.js"></script>
<script>
  const bon = Bonnard.createClient({ apiKey: "bon_pk_..." });

  bon
    .query({ measures: ["orders.revenue"] })
    .then(({ data }) => renderDashboard(data))
    .catch((err) => {
      if (err instanceof Bonnard.BonnardError) {
        showError(`Error ${err.statusCode}: ${err.message}`);
      }
    });
</script>
```

## See also

- [sdk.authentication](sdk.authentication) — Auth patterns and token refresh
- [sdk.query-reference](sdk.query-reference) — Full query API reference
- [sdk.browser](sdk.browser) — Browser / CDN quickstart
