<!-- frontend/src/lib/components/Pagination.svelte -->

<script lang="ts">
    import { pagination } from '../stores/dashboard';
    
    export let hasMore: boolean;
    export let onPageChange: (page: number) => void;
    
    function handlePageChange(newPage: number) {
        if (newPage > 0) {
            pagination.update(p => ({ ...p, page: newPage }));
            onPageChange(newPage);
        }
    }
</script>

<div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
    <div class="flex items-center">
        <span class="text-sm text-gray-700">
            Page {$pagination.page}
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
        <button
            class="px-3 py-1 rounded-md bg-gray-100"
            disabled={$pagination.page === 1}
            on:click={() => handlePageChange($pagination.page - 1)}
        >
            Previous
        </button>
        
        <button
            class="px-3 py-1 rounded-md bg-gray-100"
            disabled={!hasMore}
            on:click={() => handlePageChange($pagination.page + 1)}
        >
            Next
        </button>
    </div>
</div>