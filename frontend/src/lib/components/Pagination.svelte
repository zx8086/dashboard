<!-- frontend/src/lib/components/Pagination.svelte -->

<script lang="ts">
    import { pagination } from '../stores/dashboard';
    import { derived } from 'svelte/store';

    const pageNumbers = derived(pagination, $pagination => {
        const total = Math.ceil($pagination.total / $pagination.pageSize);
        const current = $pagination.page;
        const pages = [];
        
        for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
            pages.push(i);
        }
        
        return pages;
    });
</script>

<div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
    <div class="flex items-center">
        <span class="text-sm text-gray-700">
            Showing page {$pagination.page} of {Math.ceil($pagination.total / $pagination.pageSize)}
        </span>
        <select 
            class="ml-4 rounded-md border-gray-300 shadow-sm"
            bind:value={$pagination.pageSize}
        >
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
        </select>
    </div>
    
    <div class="flex justify-end space-x-2">
        {#each $pageNumbers as page}
            <button
                class="px-3 py-1 rounded-md {page === $pagination.page ? 'bg-blue-500 text-white' : 'bg-gray-100'}"
                on:click={() => pagination.update(p => ({ ...p, page }))}
            >
                {page}
            </button>
        {/each}
    </div>
</div>