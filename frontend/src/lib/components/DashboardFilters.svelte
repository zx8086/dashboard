<!-- frontend/src/lib/components/DashboardFilters.svelte -->

<script lang="ts">
    import { onMount } from 'svelte';
    import { filters } from '../stores/dashboard';
    
    const timeRangeOptions = [
        { value: '5m', label: 'Last 5 minutes' },
        { value: '15m', label: 'Last 15 minutes' },
        { value: '1h', label: 'Last hour' },
        { value: '3h', label: 'Last 3 hours' },
        { value: '6h', label: 'Last 6 hours' },
        { value: '24h', label: 'Last 24 hours' }
    ];

    const statusOptions = [
        { value: null, label: 'All' },
        { value: 0, label: 'Failed (Exception)' },
        { value: 1, label: 'Success (Start & End)' },
        { value: 2, label: 'In Progress (Start only)' },
        { value: 3, label: 'Unknown (No Start/End)' }
    ];

    const environmentOptions = [
        { value: 'dev', label: 'Development' },
        { value: 'qa', label: 'Quality Assurance' },
        { value: 'preprod', label: 'Pre-Production' },
        { value: 'prod', label: 'Production' }
    ];

    function handleStatusChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        const value = select.value;
        
        if (value === 'null') {
            $filters.status = null;
        } else {
            $filters.status = parseInt(value, 10);
        }
    }

    onMount(() => {
        $filters.environment = 'preprod';
    });
</script>

<div class="bg-white p-4 mb-4">
    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <!-- Time Range -->
        <div>
            <label for="timeRange" class="block text-sm font-medium text-gray-700">Time Range</label>
            <select 
                id="timeRange"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                bind:value={$filters.timeRange}
            >
                {#each timeRangeOptions as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
        </div>

        <!-- Status -->
        <div>
            <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
            <select 
                id="status"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                on:change={handleStatusChange}
                value={$filters.status === null ? 'null' : $filters.status}
            >
                {#each statusOptions as option}
                    <option value={option.value === null ? 'null' : option.value}>
                        {option.label}
                    </option>
                {/each}
            </select>
        </div>

        <!-- Application -->
        <div>
            <label for="application" class="block text-sm font-medium text-gray-700">Application</label>
            <input 
                id="application"
                type="text" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Search applications..."
                bind:value={$filters.application}
            />
        </div>

        <!-- Correlation ID -->
        <div>
            <label for="correlationId" class="block text-sm font-medium text-gray-700">Correlation ID</label>
            <input 
                id="correlationId"
                type="text" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Search by correlation ID..."
                bind:value={$filters.correlationId}
            />
        </div>

        <!-- Environment -->
        <div>
            <label for="environment" class="block text-sm font-medium text-gray-700">Environment</label>
            <select 
                id="environment"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                bind:value={$filters.environment}
            >
                {#each environmentOptions as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
        </div>

        <!-- Organization -->
        <div>
            <label for="organization" class="block text-sm font-medium text-gray-700">Organization</label>
            <input 
                id="organization"
                type="text" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Search organization..."
                bind:value={$filters.organization}
            />
        </div>

        <!-- Domain -->
        <div>
            <label for="domain" class="block text-sm font-medium text-gray-700">Domain</label>
            <input 
                id="domain"
                type="text" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Search domain..."
                bind:value={$filters.domain}
            />
        </div>

        <!-- Interface ID -->
        <div>
            <label for="interfaceId" class="block text-sm font-medium text-gray-700">Interface ID</label>
            <input 
                id="interfaceId"
                type="text" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Search interface ID..."
                bind:value={$filters.interfaceId}
            />
        </div>
    </div>
</div>
