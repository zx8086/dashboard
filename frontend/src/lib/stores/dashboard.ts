// frontend/src/lib/stores/dashboard.ts

import { writable } from 'svelte/store';

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

// Initialize with 15m as default timeRange
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