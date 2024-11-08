// backend/src/types.ts

import { estypes } from '@elastic/elasticsearch'

export interface QueryParams {
  timeRange: string;
  page?: number;
  pageSize?: number;
  status?: number;
  application?: string;
  interfaceId?: string;
  businessEntity?: string;
  search?: string;
  environment?: string;
  organization?: string;
  domain?: string;
  lastKey?: string;
}

export const validateQueryParams = (params: Partial<QueryParams>): QueryParams => {
  return {
    timeRange: params.timeRange || '15m',  // Default is now explicitly 15m
    page: params.page || 1,
    pageSize: params.pageSize || 20,
    status: typeof params.status === 'number' ? params.status : undefined,
    application: params.application || undefined,
    interfaceId: params.interfaceId || undefined,
    businessEntity: params.businessEntity || undefined,
    search: params.search || undefined,
    environment: params.environment || undefined,
    organization: params.organization || undefined,
    domain: params.domain || undefined,
    lastKey: params.lastKey || undefined
  };
};

export interface CorrelationBucket {
  key: string;
  doc_count: number;
  applications: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  interface_desc: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  interface_id: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  business_entity: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  start_time: { value: number };
  end_time: { value: number };
  has_start: { doc_count: number };
  has_end: { doc_count: number };
  has_exception: { doc_count: number };
  overall_status: { value: number };
  elapsed_time_ms: { value: number };
  app_statuses: {
    by_app: {
      buckets: Array<{
        key: string;
        doc_count: number;
        has_start: { doc_count: number };
        has_end: { doc_count: number };
        has_exception: { doc_count: number };
      }>;
    };
    apps_with_start: {
      distinct_apps: { value: number };
    };
    apps_with_end: {
      distinct_apps: { value: number };
    };
  };
}

export interface CustomAggregations {
  correlations: {
    buckets: CorrelationBucket[];
  };
}

export type EnrichedSearchResult = estypes.SearchResponse<unknown> & {
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
  aggregations?: CustomAggregations;
};
