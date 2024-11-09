<!-- frontend/src/lib/components/DashboardTable.svelte -->

<script lang="ts">
    import { onMount } from 'svelte';
    import { filters } from '../stores/dashboard';
    import StatusBadge from './StatusBadge.svelte';
    import ApplicationsList from './ApplicationsList.svelte';
    import DashboardFilters from './DashboardFilters.svelte';
    import TotalEntries from './TotalEntries.svelte';
    import { formatElapsedTime } from '../utils/time';
    import AutoRefresh from './AutoRefresh.svelte';
    
    let correlations = [];
    let loading = true;
    let loadingMore = false;
    let error = null;
    let mounted = false;
    let hasMore = true;
    let lastKey: string | null = null;
    let container: HTMLElement;
    let totalEntries = 0;
    let totalUnfiltered = 0;
    let isScrolling = false;

    // Add type safety for elapsed_time_ms
    interface ElapsedTime {
        value: number;
    }

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
            lastKey = null;
            hasMore = true;
            correlations = [];
            
            // Get total count separately (much faster)
            const countResponse = await fetch(`http://localhost:3007/api/total-count?timeRange=${$filters.timeRange}&environment=${$filters.environment}`);
            if (countResponse.ok) {
                const countResult = await countResponse.json();
                totalUnfiltered = countResult.total;
            }

            // Then get the actual data
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
            
            if (result.data) {
                correlations = result.data;
                totalEntries = result.total.value;
                lastKey = result.nextKey;
                hasMore = result.nextKey !== null;
            }

            error = null;
        } catch (err) {
            console.error('Error fetching data:', err);
            error = err.message;
            correlations = [];
        } finally {
            loading = false;
        }
    }

    async function loadMore() {
        if (loadingMore || !hasMore) return;
        
        try {
            loadingMore = true;
            const queryParams = new URLSearchParams();
            
            // Add all existing filters
            queryParams.append('timeRange', $filters.timeRange);
            queryParams.append('environment', $filters.environment);
            
            if ($filters.status !== null) {
                queryParams.append('status', $filters.status.toString());
            }
            
            if ($filters.application) {
                queryParams.append('application', $filters.application);
            }
            
            if ($filters.searchTerm) {
                queryParams.append('search', $filters.searchTerm);
            }

            if ($filters.organization) {
                queryParams.append('organization', $filters.organization);
            }

            if ($filters.domain) {
                queryParams.append('domain', $filters.domain);
            }

            if ($filters.interfaceId) {
                queryParams.append('interfaceId', $filters.interfaceId);
            }

            // Add lastKey for pagination
            if (lastKey) {
                queryParams.append('lastKey', lastKey);
            }

            const response = await fetch(`http://localhost:3007/api/correlations?${queryParams}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            
            if (result.data?.length) {
                correlations = [...correlations, ...result.data];
                lastKey = result.nextKey;
                hasMore = result.nextKey !== null && correlations.length < totalEntries;
            } else {
                hasMore = false;
            }

            // Update total entries if provided in response
            if (result.total?.value !== undefined) {
                totalEntries = result.total.value;
            }
        } catch (err) {
            console.error('Error loading more:', err);
            hasMore = false;
        } finally {
            loadingMore = false;
        }
    }

    let scrollTimeout: NodeJS.Timeout;
    
    function handleScroll(e: Event) {
        const target = e.target as HTMLElement;
        const threshold = 100;
        
        // Set scrolling state
        isScrolling = true;
        clearTimeout(scrollTimeout);
        
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 150); // Reset after 150ms of no scrolling

        // Check if we've reached the bottom and there's more data to load
        if (
            target.scrollHeight - (target.scrollTop + target.clientHeight) < threshold &&
            !loadingMore &&
            hasMore &&
            correlations.length < totalEntries
        ) {
            loadMore();
        }
    }

    $: {
        if (mounted && $filters) {
            console.log('Filters changed:', $filters);
            lastKey = null;
            hasMore = true;
            correlations = [];
            fetchData();
        }
    }
</script>

<div class="w-full bg-white shadow-lg rounded-lg">
    <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
            {#if loading && correlations.length === 0}
                Transaction Analysis - Loading...
            {:else}
                Transaction Analysis - {totalEntries?.toLocaleString() || '0'} Entries
            {/if}
        </h3>
    </div>

    <DashboardFilters />
    
    <AutoRefresh 
        onRefresh={fetchData} 
        isPaused={isScrolling || loadingMore}
    />

    <div 
        class="overflow-auto" 
        style="height: calc(100vh - 200px)"
        on:scroll={handleScroll}
        bind:this={container}
    >
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
                <thead class="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Correlation ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Applications</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Interface ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Start Time</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">End Time</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Elapsed Time</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Status</th>
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
                                {#if row.elapsed_time_ms?.value !== undefined}
                                    {formatElapsedTime(row.elapsed_time_ms.value)}
                                {:else}
                                    N/A
                                {/if}
                            </td>
                            <td class="px-6 py-4">
                                <StatusBadge status={row.overall_status.value} />
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
            
            <!-- Add loading indicator and end message -->
            <div class="text-center py-4">
                {#if loadingMore}
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                {:else if correlations.length >= totalEntries || !hasMore}
                    <p class="text-gray-500">
                        {correlations.length === 0 ? 'No results found' : `End of results - Showing ${correlations.length} of ${totalEntries} entries`}
                    </p>
                {/if}
            </div>
        {/if}
    </div>
</div>
