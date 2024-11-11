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
    interface_domain: {
        buckets: Array<{ key: string; doc_count: number }>;
    };
    interface_entity_desc: {
        buckets: Array<{ key: string; doc_count: number }>;
    };
    interface_org: {
        buckets: Array<{ key: string; doc_count: number }>;
    };
    app_statuses: {
        by_app: {
            buckets: Array<{
                key: string;
                doc_count: number;
                has_start: { doc_count: number };
                has_end: { doc_count: number };
                has_exception: { doc_count: number };
                status: { value: number };
            }>;
        };
    };
}

export interface TreeNode {
    domains?: Record<string, DomainNode>;
    interfaces?: Record<string, InterfaceNode>;
    correlations?: CorrelationNode[];
    status: 'success' | 'failed' | 'in-progress' | 'unknown';
    totalCorrelations: number;
}

export interface DomainNode extends TreeNode {}
export interface InterfaceNode extends TreeNode {}

export interface CorrelationNode {
    id: string;
    status: 'success' | 'failed' | 'in-progress' | 'unknown';
    applicationName: string;
}
