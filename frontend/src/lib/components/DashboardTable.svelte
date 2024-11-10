<!-- frontend/src/lib/components/DashboardTable.svelte -->

<script lang="ts">
    import { onMount } from 'svelte';
    import { filters } from '../stores/dashboard';
    import StatusBadge from './StatusBadge.svelte';
    import ApplicationsList from './ApplicationsList.svelte';
    import DashboardFilters from './DashboardFilters.svelte';
    import AutoRefresh from './AutoRefresh.svelte';
    import { formatElapsedTime } from '../utils/time';

    let correlations: any[] = [];
    let loading = true;
    let error: string | null = null;
    let hasMore = true;
    let lastKey: string | null = null;
    let loadingMore = false;
    let totalEntries = 0;
    let totalUnfiltered = 0;
    let isScrolling = false;
    let container: HTMLElement;

    function handleRefresh() {
        fetchData(true);
    }

    onMount(() => {
        fetchData(true);
        
        const unsubscribe = filters.subscribe(() => {
            console.log('Filters changed:', $filters);
            fetchData(true);
        });

        return () => {
            unsubscribe();
        };
    });

    async function fetchData(resetPage = false) {
        try {
            loading = true;
            error = null;
            
            if (resetPage) {
                correlations = [];
                hasMore = true;
                lastKey = null;
            }

            const queryParams = new URLSearchParams();
            
            Object.entries($filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    queryParams.append(key, value.toString());
                }
            });
            
            if (lastKey) {
                queryParams.append('lastKey', lastKey);
            }

            console.log('Sending filters:', Object.fromEntries(queryParams));
            
            const response = await fetch(`http://localhost:3007/api/correlations?${queryParams}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            console.log('Response data:', {
                totalRecords: result.total?.value || 0,
                currentPageSize: result.data?.length || 0,
                hasMorePages: result.nextKey !== null,
                nextKey: result.nextKey,
                currentCorrelationsCount: correlations.length
            });
            
            if (result.data) {
                correlations = resetPage ? result.data : [...correlations, ...result.data];
                totalEntries = result.total.value;
                lastKey = result.nextKey;
                hasMore = result.nextKey !== null;
            }

            error = null;
        } catch (err) {
            console.error('Error fetching data:', err);
            error = err instanceof Error ? err.message : 'Unknown error';
        } finally {
            loading = false;
            loadingMore = false;
        }
    }

    function handleScroll(e: Event) {
        const target = e.target as HTMLElement;
        const threshold = 100;
        
        isScrolling = true;
        clearTimeout(scrollTimeout);
        
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 150);

        if (
            target.scrollHeight - (target.scrollTop + target.clientHeight) < threshold &&
            !loadingMore &&
            hasMore &&
            correlations.length < totalEntries
        ) {
            loadMore();
        }
    }

    let scrollTimeout: NodeJS.Timeout;

    async function loadMore() {
        if (loadingMore || correlations.length >= totalEntries) return;
        
        loadingMore = true;
        await fetchData(false);
        
        hasMore = correlations.length < totalEntries;
        loadingMore = false;
    }
</script>

<div class="w-full bg-white shadow-lg rounded-lg">
    <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
            {#if loading && correlations.length === 0}
                Transaction Analysis - Loading...
            {:else if totalEntries === 0}
                Transaction Analysis - No Results Found
            {:else}
                <!-- Transaction Analysis - {totalEntries?.toLocaleString()} {totalEntries === 1 ? 'Entry' : 'Entries'} -->
                Transaction Analysis - {correlations.length} {correlations.length  === 1 ? 'Entry' : 'Entries'}
                {#if totalUnfiltered > totalEntries}
                    <span class="text-sm text-gray-500">
                        (filtered from {totalUnfiltered.toLocaleString()} total)
                    </span>
                {/if}
            {/if}
        </h3>
    </div>

    <DashboardFilters />
    
    <AutoRefresh 
        onRefresh={handleRefresh} 
        isPaused={isScrolling || loadingMore}
    />

    <div 
        class="overflow-auto max-h-screen"
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
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Domain</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Organization</th>
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
                                {row.interface_id?.buckets[0]?.key || 'N/A'}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">
                                {row.interface_domain?.buckets[0]?.key || 'No Domain'}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">
                                {#if row.interface_org?.buckets[0]?.key}
                                    {row.interface_org.buckets[0].key}
                                {:else}
                                    No Organization
                                {/if}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">
                                {#if row.start_event?.start_time?.value}
                                    {new Date(row.start_event.start_time.value).toLocaleString()}
                                {:else}
                                    N/A
                                {/if}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">
                                {#if row.end_event?.end_time?.value}
                                    {new Date(row.end_event.end_time.value).toLocaleString()}
                                {:else}
                                    N/A
                                {/if}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">
                                {#if row.elapsed_time_ms?.value !== undefined}
                                    {formatElapsedTime(row.elapsed_time_ms.value)}
                                {:else}
                                    N/A
                                {/if}
                            </td>
                            <td class="px-6 py-4">
                                <StatusBadge status={row.overall_status?.value ?? 3} />
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
            
            <!-- Add loading indicator and end message -->
            <div class="text-center py-4 text-sm text-gray-500">
                {#if totalEntries === 0}
                    <p>No results match your current filters</p>
                {:else if loadingMore}
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                {:else}
                    <p>
                        Showing {correlations.length} of {totalEntries} entries
                        {#if correlations.length >= totalEntries}
                            (End of results)
                        {/if}
                    </p>
                {/if}
            </div>
        {/if}
    </div>
</div>
