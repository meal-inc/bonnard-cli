/**
 * Metabase API client factory.
 *
 * Returns an object with typed methods for each API endpoint.
 * Uses X-API-KEY header authentication.
 */

import type {
  MetabaseConfig,
  MetabaseUser,
  MetabaseDatabase,
  MetabaseCollection,
  MetabaseCollectionTreeNode,
  MetabaseCard,
  MetabaseCollectionItem,
  MetabaseDashboardSummary,
  MetabaseDashboardDetail,
  MetabaseDatabaseMeta,
  MetabasePermissionGroup,
  MetabasePermissionsGraph,
  MetabasePopularItem,
} from "./types.js";

export class MetabaseApiError extends Error {
  constructor(
    public status: number,
    public endpoint: string,
    message: string,
  ) {
    super(message);
    this.name = "MetabaseApiError";
  }
}

export function createMetabaseClient(config: MetabaseConfig) {
  const baseUrl = config.url.replace(/\/+$/, "");

  async function metabaseFetch<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${baseUrl}/api${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "X-API-KEY": config.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const body = await res.text();
        if (body) message = body;
      } catch {}
      throw new MetabaseApiError(res.status, endpoint, message);
    }

    return res.json() as Promise<T>;
  }

  return {
    async getCurrentUser(): Promise<MetabaseUser> {
      return metabaseFetch<MetabaseUser>("/user/current");
    },

    async getDatabases(): Promise<MetabaseDatabase[]> {
      // Metabase wraps database list in { data: [...] }
      const res = await metabaseFetch<{ data: MetabaseDatabase[] }>("/database");
      return res.data;
    },

    async getCollections(): Promise<MetabaseCollection[]> {
      return metabaseFetch<MetabaseCollection[]>("/collection");
    },

    async getCollectionTree(): Promise<MetabaseCollectionTreeNode[]> {
      return metabaseFetch<MetabaseCollectionTreeNode[]>("/collection/tree");
    },

    async getCards(): Promise<MetabaseCard[]> {
      return metabaseFetch<MetabaseCard[]>("/card");
    },

    async getCard(id: number): Promise<MetabaseCard> {
      return metabaseFetch<MetabaseCard>(`/card/${id}`);
    },

    async getDashboards(): Promise<MetabaseDashboardSummary[]> {
      return metabaseFetch<MetabaseDashboardSummary[]>("/dashboard");
    },

    async getDashboard(id: number): Promise<MetabaseDashboardDetail> {
      return metabaseFetch<MetabaseDashboardDetail>(`/dashboard/${id}`);
    },

    async convertToNativeSQL(
      datasetQuery: MetabaseCard["dataset_query"],
    ): Promise<string> {
      const res = await metabaseFetch<{ query: string }>(
        "/dataset/native",
        {
          method: "POST",
          body: JSON.stringify(datasetQuery),
        },
      );
      return res.query;
    },

    async getDatabaseMetadata(id: number): Promise<MetabaseDatabaseMeta> {
      return metabaseFetch<MetabaseDatabaseMeta>(`/database/${id}/metadata`);
    },

    async getPermissionGroups(): Promise<MetabasePermissionGroup[]> {
      return metabaseFetch<MetabasePermissionGroup[]>("/permissions/group");
    },

    async getPermissionsGraph(): Promise<MetabasePermissionsGraph> {
      return metabaseFetch<MetabasePermissionsGraph>("/permissions/graph");
    },

    async getCollectionItems(id: number): Promise<MetabaseCollectionItem[]> {
      const res = await metabaseFetch<{ data: MetabaseCollectionItem[] }>(
        `/collection/${id}/items?models=card&models=dataset&models=metric&models=dashboard`,
      );
      return res.data;
    },

    async getPopularItems(): Promise<MetabasePopularItem[]> {
      return metabaseFetch<MetabasePopularItem[]>("/activity/popular_items");
    },
  };
}

export type MetabaseClient = ReturnType<typeof createMetabaseClient>;
