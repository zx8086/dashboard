<!-- frontend/src/lib/components/DashboardFilters.svelte -->

<script lang="ts">
    import { onMount } from 'svelte';
    import { filters } from '../stores/dashboard';
    
    const timeRangeOptions = [
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
        { value: 'qa', label: 'QA' },
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
        console.log('Status changed to:', $filters.status, typeof $filters.status);
    }

    onMount(() => {
        $filters.environment = 'preprod';
    });
</script>

<div class="bg-white p-4 mb-4">
    <div class="grid grid-cols-5 gap-4">
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
</div>
