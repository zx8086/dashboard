<!-- src/routes/+page.svelte -->

<script lang="ts">
    import DashboardTable from "$lib/components/DashboardTable.svelte";
</script>

<div class="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
    <div class="max-w-full mx-auto">
        <div class="bg-white rounded-lg shadow">
            <div class="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-semibold text-gray-900">
                        Mulesoft Runtime Application Dashboard
                    </h1>
                </div>
            </div>
            <DashboardTable />
        </div>
    </div>
</div>
