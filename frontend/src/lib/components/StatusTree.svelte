<script lang="ts">
    import { onMount } from 'svelte';
    import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, HelpCircle } from 'lucide-svelte';
    import { filters } from '../stores/dashboard';

    function getWorstStatus(statuses) {
        if (statuses.includes('failed')) return 'failed';
        if (statuses.includes('in_progress')) return 'in_progress';
        if (statuses.includes('success')) return 'success';
        return 'unknown';
    }

    function processData(data) {
        const tree = {};
        
        // First pass: Build the tree structure
        data.forEach(item => {
            const org = item.interface_org?.buckets[0]?.key || 'No Organisation';
            const domain = item.interface_domain?.buckets[0]?.key || 'No Domain';
            const interfaceId = item.interface_id?.buckets[0]?.key || 'Unknown';
            const correlationId = item.key;
            
            // Get the correlation status
            const correlationStatus = item.status?.toLowerCase() || 'unknown';
            const applications = item.applications?.buckets || [];
            
            if (!tree[org]) {
                tree[org] = { domains: {}, status: 'unknown', count: 0 };
            }
            
            if (!tree[org].domains[domain]) {
                tree[org].domains[domain] = { interfaces: {}, status: 'unknown', count: 0 };
            }

            if (!tree[org].domains[domain].interfaces[interfaceId]) {
                tree[org].domains[domain].interfaces[interfaceId] = {
                    correlations: {},
                    status: 'unknown',
                    count: 0
                };
            }
            
            if (!tree[org].domains[domain].interfaces[interfaceId].correlations[correlationId]) {
                tree[org].domains[domain].interfaces[interfaceId].correlations[correlationId] = {
                    applications: [],
                    status: correlationStatus,
                    count: 0
                };
            }
            
            // Add applications
            applications.forEach(app => {
                if (!tree[org].domains[domain].interfaces[interfaceId].correlations[correlationId].applications.find(a => a.key === app.key)) {
                    tree[org].domains[domain].interfaces[interfaceId].correlations[correlationId].applications.push({
                        key: app.key,
                        doc_count: app.doc_count,
                        status: correlationStatus // Applications inherit correlation status
                    });
                }
            });
            
            // Update counts
            tree[org].domains[domain].interfaces[interfaceId].correlations[correlationId].count = applications.length;
            tree[org].domains[domain].interfaces[interfaceId].count++;
            tree[org].domains[domain].count++;
            tree[org].count++;
        });
        
        // Second pass: Propagate status up the tree
        Object.entries(tree).forEach(([org, orgData]) => {
            Object.entries(orgData.domains).forEach(([domain, domainData]) => {
                Object.entries(domainData.interfaces).forEach(([interfaceId, interfaceData]) => {
                    // Get worst status from correlations
                    const correlationStatuses = Object.values(interfaceData.correlations).map(c => c.status);
                    interfaceData.status = getWorstStatus(correlationStatuses);
                });
                
                // Get worst status from interfaces
                const interfaceStatuses = Object.values(domainData.interfaces).map(i => i.status);
                domainData.status = getWorstStatus(interfaceStatuses);
            });
            
            // Get worst status from domains
            const domainStatuses = Object.values(orgData.domains).map(d => d.status);
            orgData.status = getWorstStatus(domainStatuses);
        });
        
        return tree;
    }

    // Add your status color functions
    function getStatusColor(status: string) {
        switch (status?.toLowerCase()) {
            case 'success': return 'text-green-500';
            case 'failed': return 'text-red-500';
            case 'in_progress': return 'text-yellow-500';
            case 'unknown':
            default: return 'text-gray-400';
        }
    }

    function getBackgroundColor(status: string) {
        switch (status?.toLowerCase()) {
            case 'success': return 'bg-green-50';
            case 'failed': return 'bg-red-50';
            case 'in_progress': return 'bg-yellow-50';
            case 'unknown':
            default: return 'bg-white';
        }
    }

    function getStatusBarColor(status: string) {
        switch (status?.toLowerCase()) {
            case 'success': return 'border-l-[3px] border-green-500';
            case 'failed': return 'border-l-[3px] border-red-500';
            case 'in_progress': return 'border-l-[3px] border-yellow-500';
            case 'unknown':
            default: return 'border-l-[3px] border-gray-300';
        }
    }

    export let data: any;
    let processedData = processData(data);
</script>

<div class="flex flex-col gap-2">
    <!-- Status Legend -->
    <div class="flex gap-4 items-center mb-4">
        <div class="flex items-center gap-2">
            <CheckCircle class="text-green-500" size={20} />
            <span>Success</span>
        </div>
        <div class="flex items-center gap-2">
            <XCircle class="text-red-500" size={20} />
            <span>Failed</span>
        </div>
        <div class="flex items-center gap-2">
            <Clock class="text-yellow-500" size={20} />
            <span>In Progress</span>
        </div>
        <div class="flex items-center gap-2">
            <HelpCircle class="text-gray-400" size={20} />
            <span>Unknown</span>
        </div>
    </div>

    <!-- Tree Structure -->
    <div class="flex flex-col gap-2">
        {#each Object.entries(processedData) as [org, orgData]}
            <div class="rounded-lg shadow-sm">
                <button class="w-full flex items-center p-2 hover:bg-gray-50 text-left {getBackgroundColor(orgData.status)} {getStatusBarColor(orgData.status)}">
                    <svelte:component this={ChevronRight} class="mr-2" size={16} />
                    <svelte:component 
                        this={orgData.status === 'success' ? CheckCircle :
                             orgData.status === 'failed' ? XCircle :
                             orgData.status === 'in_progress' ? Clock : HelpCircle}
                        class={getStatusColor(orgData.status)}
                        size={16}
                    />
                    <span class="ml-2">{org}</span>
                    <span class="ml-auto text-sm text-gray-500">{orgData.count} correlations</span>
                </button>

                <div class="ml-6">
                    {#each Object.entries(orgData.domains) as [domain, domainData]}
                        <div>
                            <button class="w-full flex items-center p-2 hover:bg-gray-50 text-left {getBackgroundColor(domainData.status)} {getStatusBarColor(domainData.status)}">
                                <svelte:component this={ChevronRight} class="mr-2" size={16} />
                                <svelte:component 
                                    this={domainData.status === 'success' ? CheckCircle :
                                         domainData.status === 'failed' ? XCircle :
                                         domainData.status === 'in_progress' ? Clock : HelpCircle}
                                    class={getStatusColor(domainData.status)}
                                    size={16}
                                />
                                <span class="ml-2">{domain}</span>
                                <span class="ml-auto text-sm text-gray-500">{domainData.count}</span>
                            </button>

                            <div class="ml-6">
                                {#each Object.entries(domainData.interfaces) as [interfaceId, interfaceData]}
                                    <div>
                                        <button class="w-full flex items-center p-2 hover:bg-gray-50 text-left {getBackgroundColor(interfaceData.status)} {getStatusBarColor(interfaceData.status)}">
                                            <svelte:component this={ChevronRight} class="mr-2" size={16} />
                                            <svelte:component 
                                                this={interfaceData.status === 'success' ? CheckCircle :
                                                     interfaceData.status === 'failed' ? XCircle :
                                                     interfaceData.status === 'in_progress' ? Clock : HelpCircle}
                                                class={getStatusColor(interfaceData.status)}
                                                size={16}
                                            />
                                            <span class="ml-2">{interfaceId}</span>
                                            <span class="ml-auto text-sm text-gray-500">{interfaceData.count} correlations</span>
                                        </button>

                                        <div class="ml-6">
                                            {#each Object.entries(interfaceData.correlations) as [correlationId, correlationData]}
                                                <div class="w-full flex items-center p-2 {getBackgroundColor(correlationData.status)} {getStatusBarColor(correlationData.status)}">
                                                    <svelte:component 
                                                        this={correlationData.status === 'success' ? CheckCircle :
                                                             correlationData.status === 'failed' ? XCircle :
                                                             correlationData.status === 'in_progress' ? Clock : HelpCircle}
                                                        class={getStatusColor(correlationData.status)}
                                                        size={16}
                                                    />
                                                    <span class="ml-2">{correlationId}</span>
                                                    <span class="ml-auto text-sm text-gray-500">{correlationData.count} apps</span>
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>