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
  correlationId?: string;
  environment?: string;
  organization?: string;
  domain?: string;
  lastKey?: string;
}

export const validateQueryParams = (params: Partial<QueryParams>): QueryParams => {
  return {
    timeRange: params.timeRange || '15m',  // Default is now explicitly 15m
    page: params.page || 1,
    pageSize: params.pageSize || 200,
    status: typeof params.status === 'number' ? params.status : undefined,
    application: params.application || undefined,
    interfaceId: params.interfaceId || undefined,
    businessEntity: params.businessEntity || undefined,
    correlationId: params.correlationId || undefined,
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
  interface_domain: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  interface_id: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  interface_org?: {
    buckets: Array<{ key: string; doc_count: number }>;
  };
  start_event: {
    doc_count: number;
    start_time: { value: number | null };
  };
  end_event: {
    doc_count: number;
    end_time: { value: number | null };
  };
  has_start: { doc_count: number };
  has_end: { doc_count: number };
  has_exception: { doc_count: number };
  overall_status: { value: number };
  elapsed_time_ms?: { value: number };
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

export interface PaginationResponse {
    data: CorrelationBucket[];
    total: {
        value: number;
        relation: 'eq' | 'gte';
    };
    nextKey: string | null;
    hasMore: boolean;
}
