# AI Agent Tools

> Give your AI agents direct access to your semantic layer — pre-built tools for Vercel AI SDK, LangChain, and any framework that accepts Zod schemas.

Instead of writing boilerplate tool definitions for each AI framework, import `createTools` from the SDK and get four production-ready tools that handle schema discovery, querying, SQL execution, and field metadata.

```typescript
import { createClient } from "@bonnard/sdk";
import { createTools } from "@bonnard/sdk/ai/vercel";

const bon = createClient({ apiKey: "bon_pk_..." });
const tools = createTools(bon);

const result = await generateText({
  model: anthropic("claude-sonnet-4-5-20250514"),
  tools,
  prompt: "What were our top 5 products by revenue last quarter?",
});
```

## Install

The AI tools are included in `@bonnard/sdk` — no extra packages. You only need your AI framework as a peer dependency:

```bash
# Vercel AI SDK
npm install @bonnard/sdk ai @ai-sdk/anthropic

# LangChain / LangGraph
npm install @bonnard/sdk @langchain/core @langchain/anthropic @langchain/langgraph
```

## Framework adapters

### Vercel AI SDK

```typescript
import { createClient } from "@bonnard/sdk";
import { createTools } from "@bonnard/sdk/ai/vercel";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const bon = createClient({ apiKey: "bon_pk_..." });
const tools = createTools(bon);

// tools is Record<string, CoreTool> — spread with your own tools
const result = await generateText({
  model: anthropic("claude-sonnet-4-5-20250514"),
  tools: { ...tools, ...myOtherTools },
  maxSteps: 10,
  prompt: "Show me revenue by region for the last 6 months",
});
```

### LangChain / LangGraph

```typescript
import { createClient } from "@bonnard/sdk";
import { createTools } from "@bonnard/sdk/ai/langchain";
import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

const bon = createClient({ apiKey: "bon_pk_..." });
const tools = createTools(bon);

// tools is DynamicStructuredTool[] — spread with your own tools
const agent = createReactAgent({
  llm: new ChatAnthropic({ model: "claude-sonnet-4-5-20250514" }),
  tools: [...tools, ...myOtherTools],
});

const result = await agent.invoke({
  messages: [{ role: "user", content: "What data sources are available?" }],
});
```

### Framework-agnostic

If your framework isn't listed above, import the base tools and wrap them yourself. Each tool has a `name`, `description`, `schema` (Zod), and `execute` function:

```typescript
import { createClient } from '@bonnard/sdk';
import { createTools } from '@bonnard/sdk/ai';
import type { BonnardTool } from '@bonnard/sdk/ai';

const bon = createClient({ apiKey: 'bon_pk_...' });
const tools = createTools(bon); // BonnardTool[]

// Wrap for your framework
for (const tool of tools) {
  console.log(tool.name);        // "explore_schema"
  console.log(tool.description);  // "Discover available data sources..."
  console.log(tool.schema);       // Zod schema — convert to JSON Schema with zod-to-json-schema
  await tool.execute({ ... });    // Call directly
}
```

This also works for MCP servers — convert the Zod schemas to JSON Schema with `zod-to-json-schema`.

## Tools included

Every `createTools(client)` call returns four tools:

### explore_schema

Discover available data sources, their measures, dimensions, and segments.

| Parameter | Type      | Description                                               |
| --------- | --------- | --------------------------------------------------------- |
| `name`    | `string?` | Source name to get full field listings (e.g. `"orders"`)  |
| `search`  | `string?` | Keyword to search across all field names and descriptions |

```typescript
// No args — list all sources with summary counts
await tools.explore_schema.execute({});
// → [{ name: "orders", type: "view", measures: 5, dimensions: 8, segments: 1 }]

// By name — full field details for one source
await tools.explore_schema.execute({ name: "orders" });
// → { name: "orders", measures: [...], dimensions: [...], segments: [...] }

// Search — find fields by keyword across all sources
await tools.explore_schema.execute({ search: "revenue" });
// → [{ source: "orders", field: "orders.revenue", kind: "measure", type: "number" }]
```

### query

Run structured queries with measures, dimensions, filters, and time dimensions. All field names must be fully qualified (e.g. `"orders.revenue"`).

| Parameter        | Type        | Description                                                  |
| ---------------- | ----------- | ------------------------------------------------------------ |
| `measures`       | `string[]?` | Measures to aggregate (e.g. `["orders.revenue"]`)            |
| `dimensions`     | `string[]?` | Dimensions to group by                                       |
| `timeDimensions` | `array?`    | Time dimensions with `dimension`, `granularity`, `dateRange` |
| `filters`        | `array?`    | Filters with `member`, `operator`, `values`                  |
| `segments`       | `string[]?` | Pre-defined filter segments                                  |
| `order`          | `object?`   | Sort order (e.g. `{ "orders.revenue": "desc" }`)             |
| `limit`          | `number?`   | Max rows (default 250)                                       |
| `offset`         | `number?`   | Pagination offset                                            |

### sql_query

Execute raw SQL when structured queries can't express what you need — CTEs, UNIONs, custom arithmetic.

| Parameter | Type     | Description                                             |
| --------- | -------- | ------------------------------------------------------- |
| `sql`     | `string` | SQL using Cube syntax with `MEASURE()` for aggregations |

### describe_field

Get metadata for a specific field — its type, description, and which source it belongs to.

| Parameter | Type     | Description                                          |
| --------- | -------- | ---------------------------------------------------- |
| `field`   | `string` | Fully qualified field name (e.g. `"orders.revenue"`) |

## Authentication for agents

The tools use whatever auth you configure on the client. All three patterns work:

### Simple: publishable key

Best for internal tools or prototypes — all queries run with your org's full access.

```typescript
const bon = createClient({ apiKey: "bon_pk_..." });
const tools = createTools(bon);
```

### Multi-tenant: token exchange

For B2B apps where each customer's agent should only see their own data. Your backend exchanges a secret key for a scoped token:

```typescript
// Server-side: create client with token exchange
const bon = createClient({
  fetchToken: async () => {
    const res = await fetch("https://app.bonnard.dev/api/sdk/token", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BONNARD_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        security_context: { tenant_id: currentUser.tenantId },
      }),
    });
    const { token } = await res.json();
    return token;
  },
});

const tools = createTools(bon);
// Agent queries are automatically scoped to the tenant's data
```

See [sdk.authentication](sdk.authentication) for details on token refresh and security context.

### Frontend: Clerk session

For apps where users authenticate through Clerk:

```typescript
import { useAuth } from "@clerk/nextjs";

const { getToken } = useAuth();
const bon = createClient({
  fetchToken: () => getToken(),
});
const tools = createTools(bon);
```

## Tips for better agent responses

### Add a system prompt with context

The tools give the agent the ability to query, but a good system prompt tells it how to approach your data:

```typescript
const result = await generateText({
  model: anthropic("claude-sonnet-4-5-20250514"),
  tools,
  maxSteps: 10,
  system: `You are a data analyst. Always start by calling explore_schema to understand
what data is available before querying. Use describe_field to understand metrics
before presenting results. Format numbers with appropriate units.`,
  prompt: userMessage,
});
```

### Set maxSteps high enough

Agents typically need 3–5 steps: explore schema → understand fields → query → maybe refine. Set `maxSteps: 10` to give the agent room to work.

### Combine with your own tools

The adapters return spreadable formats so you can mix Bonnard tools with your own:

```typescript
// Vercel AI SDK — Record<string, CoreTool>
const result = await generateText({
  tools: { ...bonnardTools, saveReport, sendEmail },
});

// LangChain — StructuredTool[]
const agent = createReactAgent({
  tools: [...bonnardTools, saveReport, sendEmail],
});
```

## See also

- [sdk](sdk) — SDK overview and installation
- [sdk.authentication](sdk.authentication) — Auth patterns (publishable keys, token exchange)
- [sdk.query-reference](sdk.query-reference) — Full query API reference
- [mcp](mcp) — MCP server setup (alternative to SDK tools for Claude, ChatGPT, etc.)
- [access-control.security-context](access-control.security-context) — Row-level security for multi-tenant apps
