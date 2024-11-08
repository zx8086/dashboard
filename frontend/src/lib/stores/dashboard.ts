// frontend/src/lib/stores/dashboard.ts

import { writable } from 'svelte/store';

export interface FilterState {
    timeRange: string;
    status: number | null;
    application: string;
    searchTerm: string;
}

export interface PaginationState {
    page: number;
    pageSize: number;
    total: number;
}

// Initialize with 15m as default timeRange
export const filters = writable<FilterState>({
    timeRange: '15m',
    status: null,
    application: '',
    searchTerm: ''
});

export const pagination = writable<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0
});