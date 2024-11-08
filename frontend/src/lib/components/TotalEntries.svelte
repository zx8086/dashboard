<script lang="ts">
    export let totalEntries: number = 0;
</script>

<div class="text-sm text-gray-500 mb-2">
    Total Entries: {totalEntries?.toLocaleString() || '0'}
</div> 