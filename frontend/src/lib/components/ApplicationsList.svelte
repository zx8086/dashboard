<!-- frontend/src/lib/components/ApplicationsList.svelte -->

<script lang="ts">
    export let applications: Array<{ key: string; doc_count: number }>;
</script>

<div class="flex flex-col gap-1">
    {#each applications as app}
        <div class="flex items-center gap-2">
            <span class="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                {app.key}
            </span>
            <span class="text-xs text-gray-500">
                ({app.doc_count} {app.doc_count === 1 ? 'trace' : 'traces'})
            </span>
        </div>
    {/each}
</div>
