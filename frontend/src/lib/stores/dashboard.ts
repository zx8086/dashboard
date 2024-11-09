// frontend/src/lib/stores/dashboard.ts

import { writable, derived } from 'svelte/store';

export interface FilterState {
    timeRange: string;
    status: number | null;
    application: string;
    searchTerm: string;
    environment: string;
    organization: string;
    domain: string;
    interfaceId: string;
}

export interface PaginationState {
    page: number;
    pageSize: number;
    total: number;
}

export interface RefreshState {
    isRefreshing: boolean;
    lastRefresh: Date | null;
}

// Initialize with default values
export const filters = writable<FilterState>({
    timeRange: '15m',
    status: null,
    application: '',
    searchTerm: '',
    environment: 'preprod',
    organization: '',
    domain: '',
    interfaceId: ''
});

// Create a derived store that formats the filters for the API
export const apiFilters = derived(filters, $filters => {
    const params: Record<string, string | number> = {};
    
    // Always include timeRange and environment
    params.timeRange = $filters.timeRange;
    params.environment = $filters.environment;
    
    // Only add other filters if they have values
    if ($filters.status !== null) params.status = $filters.status;
    if ($filters.application) params.application = $filters.application;
    if ($filters.searchTerm) params.search = $filters.searchTerm;
    if ($filters.organization) params.organization = $filters.organization;
    if ($filters.domain) params.domain = $filters.domain;
    if ($filters.interfaceId) params.interfaceId = $filters.interfaceId;
    
    return params;
});

export const pagination = writable<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0
});

// Add new refresh store
export const refreshState = writable<RefreshState>({
    isRefreshing: true,
    lastRefresh: null
});