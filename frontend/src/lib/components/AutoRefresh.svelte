<script lang="ts">
    import { refreshState } from '../stores/dashboard';
    import { onMount, onDestroy } from 'svelte';

    const REFRESH_INTERVAL = 1 * 60 * 1000; // 3 minutes
    let intervalId: NodeJS.Timeout | null = null;

    export let onRefresh: () => void;
    export let isPaused = false;

    // Watch for external pause state changes
    $: if (isPaused && intervalId) {
        pauseRefresh();
    }

    function startRefresh() {
        if (intervalId) clearInterval(intervalId);
        
        $refreshState.isRefreshing = true;
        $refreshState.lastRefresh = new Date();
        
        // Immediately trigger first refresh
        onRefresh();
        
        intervalId = setInterval(() => {
            if (!isPaused) {
                $refreshState.lastRefresh = new Date();
                onRefresh();
            }
        }, REFRESH_INTERVAL);
    }

    function pauseRefresh() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        $refreshState.isRefreshing = false;
    }

    function toggleRefresh() {
        if ($refreshState.isRefreshing) {
            pauseRefresh();
        } else {
            startRefresh();
        }
    }

    onMount(() => {
        if (!isPaused) startRefresh();
    });

    onDestroy(() => {
        if (intervalId) clearInterval(intervalId);
    });
</script>

<div class="flex items-center justify-end space-x-2 px-4 py-2">
    <button
        type="button"
        class={`flex items-center justify-center p-2 rounded-full transition-colors ${
            !$refreshState.isRefreshing ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
        }`}
        on:click={toggleRefresh}
        aria-label={$refreshState.isRefreshing ? 'Pause refresh' : 'Start refresh'}
    >
        {#if $refreshState.isRefreshing}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-white">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
        {:else}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 text-white">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
        {/if}
    </button>
    {#if $refreshState.lastRefresh}
        <span class="text-sm text-gray-500">
            Last refresh: {$refreshState.lastRefresh.toLocaleTimeString()}
        </span>
    {/if}
</div>
