<!-- frontend/src/lib/components/DashboardTable.svelte -->

<script lang="ts">
    import { onMount } from 'svelte';
    import { filters } from '../stores/dashboard';
    import StatusBadge from './StatusBadge.svelte';
    import ApplicationsList from './ApplicationsList.svelte';
    import DashboardFilters from './DashboardFilters.svelte';
    import TotalEntries from './TotalEntries.svelte';
    
    let correlations = [];
    let loading = true;
    let loadingMore = false;
    let error = null;
    let mounted = false;
    let hasMore = true;
    let lastKey: string | null = null;
    let container: HTMLElement;
    let totalEntries = 0;

    onMount(() => {
        mounted = true;
        fetchData();
        return () => {
            mounted = false;
        };
    });

    async function fetchData() {
        if (!mounted) return;
        
        try {
            loading = true;
            const queryParams = new URLSearchParams();
            
            // Add required filters
            queryParams.append('timeRange', $filters.timeRange);
            queryParams.append('environment', $filters.environment);
            
            // Add optional filters only if they have values
            if ($filters.status !== null) {
                queryParams.append('status', $filters.status.toString());
            }
            
            if ($filters.application) {
                queryParams.append('application', $filters.application);
            }
            
            if ($filters.searchTerm) {
                queryParams.append('search', $filters.searchTerm);
            }

            const response = await fetch(`http://localhost:3007/api/correlations?${queryParams}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            correlations = result.data;
            totalEntries = result.total;
            error = null;
        } catch (err) {
            console.error('Error fetching data:', err);
            error = err instanceof Error ? err.message : 'Failed to fetch results';
            correlations = [];
            totalEntries = 0;
        } finally {
            loading = false;
        }
    }

    async function loadMore() {
        if (loadingMore || !hasMore) return;
        
        try {
            loadingMore = true;
            const currentLength = correlations.length;
            
            const response = await fetch(`http://localhost:3007/api/correlations?${new URLSearchParams({
                ...Object.fromEntries(Object.entries($filters).filter(([_, v]) => v != null)),
                lastKey: lastKey
            })}`);
            
            const data = await response.json();
            
            if (data.aggregations?.correlations?.buckets) {
                const newItems = data.aggregations.correlations.buckets;
                correlations = [...correlations, ...newItems];
                lastKey = newItems[newItems.length - 1]?.key;
                hasMore = newItems.length > 0;
            }
        } catch (err) {
            console.error('Error loading more:', err);
        } finally {
            loadingMore = false;
        }
    }

    function handleScroll(e: Event) {
        const target = e.target as HTMLElement;
        const threshold = 100;
        if (
            target.scrollHeight - (target.scrollTop + target.clientHeight) < threshold &&
            !loadingMore &&
            hasMore
        ) {
            loadMore();
        }
    }

    $: if (mounted && $filters) {
        console.log('Filters changed:', $filters);
        fetchData();
    }
</script>

<div class="w-full bg-white shadow-lg rounded-lg">
    <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
            Transaction Analysis - {totalEntries} Entries
        </h3>
    </div>

    <DashboardFilters />

    <div class="overflow-auto" style="height: calc(100vh - 200px)">
        {#if loading && correlations.length === 0}
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
                    on:click={() => fetchData()}
                >
                    Retry
                </button>
            </div>
        {:else if correlations.length === 0}
            <div class="text-gray-500 p-4 text-center">
                No results found
            </div>
        {:else}
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
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.key}
                            </td>
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
            
            <!-- Add this end-of-results indicator -->
            <div class="text-center py-4 text-sm text-gray-500 border-t border-gray-200">
                {#if loadingMore}
                    <div class="flex justify-center items-center gap-2">
                        <div class="animate-spin h-4 w-4 border-b-2 border-gray-500 rounded-full"></div>
                        Loading more...
                    </div>
                {:else}
                    End of results - {totalEntries} entries found
                {/if}
            </div>
        {/if}
    </div>
</div>
