<!-- frontend/src/lib/components/StatusBadge.svelte -->

<script lang="ts">
    export let status: number;

    const statusMap: Record<number, { label: string; bgColor: string }> = {
        0: { label: "Failed", bgColor: "bg-red-500" },        // Has Exception
        1: { label: "Success", bgColor: "bg-green-500" },     // Has Start & End
        2: { label: "In Progress", bgColor: "bg-yellow-500" }, // Has Start only
        3: { label: "Unknown", bgColor: "bg-gray-500" }       // No Start/End
    };

    $: statusDetails = statusMap[status] ?? statusMap[3];
</script>

<span
    class="{statusDetails.bgColor} w-32 justify-center text-white px-3 py-1 rounded-md text-sm font-medium inline-flex items-center gap-1 {status === 0 ? 'animate-pulse' : ''}"
>
    {#if status === 2}
        <svg class="motion-reduce:hidden animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
    {/if}
    {statusDetails.label}
</span>