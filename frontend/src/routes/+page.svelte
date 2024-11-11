<!-- src/routes/+page.svelte -->

<script lang="ts">
    import DashboardTable from "$lib/components/DashboardTable.svelte";
    import StatusTree from "$lib/components/StatusTree.svelte";
    import DashboardFilters from "$lib/components/DashboardFilters.svelte";
    import { ViewIcon, TableIcon } from 'lucide-svelte';

    let viewMode: 'table' | 'tree' = 'table';
</script>

<div class="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-full mx-auto">
        <div class="bg-white rounded-lg shadow">
            <div class="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center mb-4">
                    <h1 class="text-2xl font-semibold text-gray-900">
                        Mulesoft Runtime Application Dashboard
                    </h1>
                    <div class="flex gap-2">
                        <button
                            class={`p-2 rounded ${viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                            on:click={() => viewMode = 'table'}
                        >
                            <TableIcon class="w-5 h-5" />
                        </button>
                        <button
                            class={`p-2 rounded ${viewMode === 'tree' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                            on:click={() => viewMode = 'tree'}
                        >
                            <ViewIcon class="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <DashboardFilters />
            </div>
            
            <div class="border-t border-gray-200">
                {#if viewMode === 'table'}
                    <DashboardTable />
                {:else}
                    <StatusTree />
                {/if}
            </div>
        </div>
    </div>
</div>
