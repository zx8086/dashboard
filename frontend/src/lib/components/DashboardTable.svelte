<!-- frontend/src/lib/components/DashboardTable.svelte -->

<script lang="ts">
    import { onMount } from 'svelte';
    import { filters, pagination } from '../stores/dashboard';
    import StatusBadge from './StatusBadge.svelte';
    import ApplicationsList from './ApplicationsList.svelte';
    import DashboardFilters from './DashboardFilters.svelte';
    
    let correlations = [];
    let loading = true;
    let error = null;
    let mounted = false;
    let afterKey: any = null;

    async function fetchData() {
        if (!mounted) return;
        
        try {
            loading = true;
            const queryParams = new URLSearchParams();
            
            queryParams.append('timeRange', $filters.timeRange);
            
            if ($filters.status !== null) {
                queryParams.append('status', $filters.status.toString());
            }
            
            if ($filters.application) {
                queryParams.append('application', $filters.application);
            }
            
            if ($filters.searchTerm) {
                queryParams.append('search', $filters.searchTerm);
            }

            if (afterKey) {
                queryParams.append('afterKey', JSON.stringify(afterKey));
            }

            const response = await fetch(`http://localhost:3007/api/correlations?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.data) {
                throw new Error('Invalid response format');
            }

            correlations = result.data;
            afterKey = result.afterKey;
            error = null;
            
            pagination.update(p => ({
                ...p,
                total: result.total,
                hasMore: result.hasMore
            }));

        } catch (e) {
            console.error('Fetch error:', e);
            error = e instanceof Error ? e.message : 'An error occurred';
            correlations = [];
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        mounted = true;
        fetchData();
    });

    $: if (mounted && $filters) {
        fetchData();
    }
</script>

<div class="w-full bg-white shadow-lg rounded-lg">
    <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
            Transaction Analysis - {correlations.length} Entries
        </h3>
    </div>

    <DashboardFilters />

    {#if loading}
        <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900">
                <span class="sr-only">Loading...</span>
            </div>
        </div>
    {:else if error}
        <div class="text-red-500 p-4 bg-red-50 rounded m-4">
            <p class="font-bold">Error loading data:</p>
            <p>{error}</p>
            <button 
                class="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded"
                on:click={fetchData}
            >
                Retry
            </button>
        </div>
    {:else if correlations.length === 0}
        <div class="text-gray-500 p-4 text-center">
            No results found
        </div>
    {:else}
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correlation ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interface ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Elapsed Time</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    {#each correlations as row}
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.key}</td>
                            <td class="px-6 py-4">
                                <ApplicationsList applications={row.applications.buckets} />
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">
                                {row.interface_id.buckets[0]?.key || ''}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">
                                {new Date(row.start_time.value).toLocaleString()}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">
                                {new Date(row.end_time.value).toLocaleString()}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">
                                {row.elapsed_time_ms?.value || '-'}
                            </td>
                            <td class="px-6 py-4">
                                <StatusBadge status={row.overall_status.value} />
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>
