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

    const organizationOptions = [
        { value: '', label: 'All Organizations' },
        { value: 'Global Value Chain', label: 'Global Value Chain' },
        // Add other organizations as needed
    ];

    const domainOptions = [
        { value: '', label: 'All Domains' },
        { value: 'Supply Chain', label: 'Supply Chain' },
        // Add other domains as needed
    ];

    function handleStatusChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        const value = select.value;
        
        if (value === 'null') {
            $filters.status = null;
        } else {
            $filters.status = parseInt(value, 10);
        }
        console.log('Status changed to:', $filters.status, typeof $filters.status);
    }

    onMount(() => {
        $filters.environment = 'preprod';
    });
</script>

<div class="bg-white p-4 mb-4">
    <div class="grid grid-cols-5 gap-4 mb-4">
        <!-- Time Range -->
        <div>
            <label class="block text-sm font-medium text-gray-700">Time Range</label>
            <select 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                bind:value={$filters.timeRange}
            >
                {#each timeRangeOptions as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
        </div>

        <!-- Status -->
        <div>
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <select 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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

        <!-- Application Search -->
        <div>
            <label class="block text-sm font-medium text-gray-700">Application</label>
            <input 
                type="text" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Search applications..."
                bind:value={$filters.application}
            />
        </div>

        <!-- Search -->
        <div>
            <label class="block text-sm font-medium text-gray-700">Search</label>
            <input 
                type="text" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Search correlation IDs..."
                bind:value={$filters.searchTerm}
            />
        </div>

        <!-- New Environment Filter -->
        <div>
            <label class="block text-sm font-medium text-gray-700">Environment</label>
            <select 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                bind:value={$filters.environment}
            >
                {#each environmentOptions as option}
                    <option value={option.value}>{option.label}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="grid grid-cols-3 gap-4">
        <!-- Organization -->
        <div>
            <label class="block text-sm font-medium text-gray-700">Organization</label>
            <input 
                type="text" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Search organization..."
                bind:value={$filters.organization}
            />
        </div>

        <!-- Domain -->
        <div>
            <label class="block text-sm font-medium text-gray-700">Domain</label>
            <input 
                type="text" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Search domain..."
                bind:value={$filters.domain}
            />
        </div>

        <!-- Interface ID -->
        <div>
            <label class="block text-sm font-medium text-gray-700">Interface ID</label>
            <input 
                type="text" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Search interface ID..."
                bind:value={$filters.interfaceId}
            />
        </div>
    </div>
</div>
