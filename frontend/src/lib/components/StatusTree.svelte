<script lang="ts">
    import { onMount } from 'svelte';
    import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, HelpCircle } from 'lucide-svelte';
    import { filters } from '../stores/dashboard';

    let correlations = [];
    let loading = true;
    let error: string | null = null;
    let expandedState: Record<string, boolean> = {};

    // Status constants
    const STATUS = {
        FAILED: 0,
        SUCCESS: 1,
        IN_PROGRESS: 2,
        UNKNOWN: 3
    };

    // Calculate status based on children statuses
    function calculateStatus(items: any[], isCorrelationLevel = false) {
        if (!items || items.length === 0) return STATUS.UNKNOWN;

        // For correlation level, keep all status types
        if (isCorrelationLevel) {
            return items[0].status ?? STATUS.UNKNOWN;
        }

        // For higher levels (interface/domain/org), only propagate SUCCESS/FAILED
        const hasFailure = items.some(item => item === STATUS.FAILED);
        if (hasFailure) return STATUS.FAILED;
        
        const hasSuccess = items.some(item => item === STATUS.SUCCESS);
        if (hasSuccess) return STATUS.SUCCESS;

        return STATUS.UNKNOWN; // Default if no success/failure found
    }

    function getStatusIcon(status: number) {
        switch (status) {
            case 1: return CheckCircle;  // Success
            case 0: return XCircle;      // Failed
            case 2: return Clock;        // In Progress
            default: return HelpCircle;  // Unknown
        }
    }

    function getStatusColor(status: number) {
        switch (status) {
            case 1: return 'text-green-500';  // Success
            case 0: return 'text-red-500';    // Failed
            case 2: return 'text-yellow-500'; // In Progress
            default: return 'text-gray-500';  // Unknown
        }
    }

    function getStatusBarColor(status: number) {
        switch (status) {
            case 1: return 'border-l-4 border-green-500';  // Success
            case 0: return 'border-l-4 border-red-500';    // Failed
            case 2: return 'border-l-4 border-yellow-500'; // In Progress
            default: return 'border-l-4 border-gray-300';  // Unknown
        }
    }

    function toggleNode(path: string) {
        expandedState[path] = !expandedState[path];
        expandedState = expandedState;
    }

    function processData(data) {
        const tree = {};
        
        // First pass: Build the tree structure
        data.forEach(item => {
            const org = item.interface_org?.buckets[0]?.key || 'No Organisation';
            const domain = item.interface_domain?.buckets[0]?.key || 'No Domain';
            const interfaceId = item.interface_id?.buckets[0]?.key || 'Unknown';
            const correlationId = item.key;
            const status = item.overall_status?.value ?? STATUS.UNKNOWN;
            
            // Initialize tree structure
            if (!tree[org]) {
                tree[org] = { domains: {}, status: STATUS.UNKNOWN, count: 0 };
            }
            if (!tree[org].domains[domain]) {
                tree[org].domains[domain] = { interfaces: {}, status: STATUS.UNKNOWN, count: 0 };
            }
            if (!tree[org].domains[domain].interfaces[interfaceId]) {
                tree[org].domains[domain].interfaces[interfaceId] = {
                    correlations: {},
                    status: STATUS.UNKNOWN,
                    count: 0
                };
            }

            // Set correlation with its status (keeping all status types at this level)
            tree[org].domains[domain].interfaces[interfaceId].correlations[correlationId] = {
                status: status,
                count: item.applications?.buckets.length ?? 0,
                applications: item.applications?.buckets.map(app => ({
                    key: app.key,
                    doc_count: app.doc_count
                })) || []
            };

            // Update counts
            tree[org].domains[domain].interfaces[interfaceId].count++;
            tree[org].domains[domain].count++;
            tree[org].count++;
        });

        // Second pass: Calculate statuses bottom-up (only SUCCESS/FAILED)
        Object.keys(tree).forEach(org => {
            Object.keys(tree[org].domains).forEach(domain => {
                Object.keys(tree[org].domains[domain].interfaces).forEach(interfaceId => {
                    const interface_ = tree[org].domains[domain].interfaces[interfaceId];
                    
                    // Get correlation statuses (keeping original status)
                    const correlationStatuses = Object.values(interface_.correlations)
                        .map(c => c.status);
                    interface_.status = calculateStatus(correlationStatuses);
                });

                // Calculate domain status (SUCCESS/FAILED only)
                const domainStatuses = Object.values(tree[org].domains[domain].interfaces)
                    .map(i => i.status);
                tree[org].domains[domain].status = calculateStatus(domainStatuses);
            });

            // Calculate org status (SUCCESS/FAILED only)
            const orgStatuses = Object.values(tree[org].domains)
                .map(d => d.status);
            tree[org].status = calculateStatus(orgStatuses);
        });

        return tree;
    }

    async function fetchData() {
        try {
            loading = true;
            error = null;
            
            const queryParams = new URLSearchParams();
            Object.entries($filters).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                    queryParams.append(key, value.toString());
                }
            });
            queryParams.append('view', 'tree');

            const url = `http://localhost:3007/api/correlations?${queryParams}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            correlations = result.data || [];
            
        } catch (err) {
            console.error('Error fetching data:', err);
            error = err instanceof Error ? err.message : 'Unknown error';
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchData();
        return filters.subscribe(() => fetchData());
    });

    $: processedData = processData(correlations);
</script>

<!-- Rest of your template code remains the same -->
<div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Interface Status by Organization and Domain</h2>
    
    <!-- Status Legend -->
    <div class="flex gap-4 mb-6">
        <div class="flex items-center gap-2">
            <CheckCircle class="w-5 h-5 text-green-500" />
            <span>Success</span>
        </div>
        <div class="flex items-center gap-2">
            <XCircle class="w-5 h-5 text-red-500" />
            <span>Failed</span>
        </div>
        <div class="flex items-center gap-2">
            <Clock class="w-5 h-5 text-yellow-500" />
            <span>In Progress</span>
        </div>
        <div class="flex items-center gap-2">
            <HelpCircle class="w-5 h-5 text-gray-500" />
            <span>Unknown</span>
        </div>
    </div>

    {#if loading}
        <div class="flex justify-center items-center h-64">
            <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
    {:else if error}
        <div class="text-red-500 p-4 bg-red-50 rounded">
            <p class="font-bold">Error: {error}</p>
        </div>
    {:else if Object.keys(processedData).length === 0}
        <div class="text-gray-500 p-4 bg-gray-50 rounded text-center">
            <p>No data available. Please adjust your filters and try again.</p>
        </div>
    {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each Object.entries(processedData) as [org, orgData]}
                <div class="border rounded-lg shadow-sm bg-white overflow-hidden">
                    <div class={`p-4 border-b ${getStatusBarColor(orgData.status)}`}>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <svelte:component 
                                    this={getStatusIcon(orgData.status)} 
                                    class={`w-5 h-5 ${getStatusColor(orgData.status)}`}
                                />
                                <h3 class="font-semibold">{org}</h3>
                            </div>
                            <span class="text-sm text-gray-500">
                                {orgData.count} correlations
                            </span>
                        </div>
                    </div>

                    <!-- Domains List -->
                    <div class="p-2">
                        {#each Object.entries(orgData.domains) as [domain, domainData]}
                            <div class="border-b last:border-b-0">
                                <button 
                                    class="w-full flex items-center p-2 hover:bg-gray-50 text-left"
                                    on:click={() => toggleNode(`${org}.${domain}`)}
                                >
                                    <svelte:component
                                        this={expandedState[`${org}.${domain}`] ? ChevronDown : ChevronRight}
                                        class="w-4 h-4 text-gray-400 mr-1"
                                    />
                                    <svelte:component 
                                        this={getStatusIcon(domainData.status)} 
                                        class={`w-4 h-4 ${getStatusColor(domainData.status)} mr-2`}
                                    />
                                    <span>{domain}</span>
                                    <span class="text-sm text-gray-500 ml-auto">
                                        {domainData.count}
                                    </span>
                                </button>

                                {#if expandedState[`${org}.${domain}`]}
                                    <div class="ml-6">
                                        {#each Object.entries(domainData.interfaces) as [interfaceId, interfaceData]}
                                            <div class="border-t">
                                                <button 
                                                    class="w-full flex items-center p-2 hover:bg-gray-50 text-left"
                                                    on:click={() => toggleNode(`${org}.${domain}.${interfaceId}`)}
                                                >
                                                    <svelte:component
                                                        this={expandedState[`${org}.${domain}.${interfaceId}`] ? ChevronDown : ChevronRight}
                                                        class="w-4 h-4 text-gray-400 mr-1"
                                                    />
                                                    <svelte:component 
                                                        this={getStatusIcon(interfaceData.status)} 
                                                        class={`w-4 h-4 ${getStatusColor(interfaceData.status)} mr-2`}
                                                    />
                                                    <span class="text-sm">{interfaceId}</span>
                                                    <span class="text-xs text-gray-500 ml-auto">
                                                        {interfaceData.count} correlations
                                                    </span>
                                                </button>

                                                {#if expandedState[`${org}.${domain}.${interfaceId}`]}
                                                    <div class="ml-6">
                                                        {#each Object.entries(interfaceData.correlations) as [correlationId, correlationData]}
                                                            <div class="border-t">
                                                                <button 
                                                                    class="w-full flex items-center p-2 hover:bg-gray-50 text-left"
                                                                    on:click={() => toggleNode(`${org}.${domain}.${interfaceId}.${correlationId}`)}
                                                                >
                                                                    <svelte:component
                                                                        this={expandedState[`${org}.${domain}.${interfaceId}.${correlationId}`] ? ChevronDown : ChevronRight}
                                                                        class="w-4 h-4 text-gray-400 mr-1"
                                                                    />
                                                                    <svelte:component 
                                                                        this={getStatusIcon(correlationData.status)} 
                                                                        class={`w-4 h-4 ${getStatusColor(correlationData.status)} mr-2`}
                                                                    />
                                                                    <span class="text-sm truncate">{correlationId}</span>
                                                                    <span class="text-xs text-gray-500 ml-auto">
                                                                        {correlationData.count} apps
                                                                    </span>
                                                                </button>

                                                                {#if expandedState[`${org}.${domain}.${interfaceId}.${correlationId}`]}
                                                                    <div class="ml-6 py-1">
                                                                        {#each correlationData.applications as app}
                                                                            <div class="flex items-center p-2 text-sm">
                                                                                <svelte:component 
                                                                                    this={getStatusIcon(app.status)} 
                                                                                    class={`w-4 h-4 ${getStatusColor(app.status)} mr-2`}
                                                                                />
                                                                                <span>{app.key}</span>
                                                                                <span class="text-xs text-gray-500 ml-2">
                                                                                    ({app.doc_count} {app.doc_count === 1 ? 'trace' : 'traces'})
                                                                                </span>
                                                                            </div>
                                                                        {/each}
                                                                    </div>
                                                                {/if}
                                                            </div>
                                                        {/each}
                                                    </div>
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>