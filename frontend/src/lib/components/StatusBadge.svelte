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
    class="{statusDetails.bgColor} text-white px-3 py-1 rounded-md text-sm font-medium"
>
    {statusDetails.label}
</span>
