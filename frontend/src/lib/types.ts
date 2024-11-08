// frontend/src/lib/types.ts

export interface FilterMetadata {
    environments: Array<{ key: string; doc_count: number }>;
    organizations: Array<{ key: string; doc_count: number }>;
    domains: Array<{ key: string; doc_count: number }>;
}

export interface DashboardData {
    meta: {
        filters: FilterMetadata;
        pagination: {
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
        };
    };
    aggregations?: {
        correlations: {
            buckets: CorrelationData[];
        };
    };
}

export interface CorrelationData {
    key: string | { correlation: string };
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
    status: { value: number };
    elapsed_time_ms: {
        value: number | null;
    };
}
