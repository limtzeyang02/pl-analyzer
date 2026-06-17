<script setup lang="ts">
    import type { ChartData, ChartOptions } from "chart.js";
    import {
        ArcElement,
        Chart,
        DoughnutController,
        Legend,
        Tooltip,
    } from "chart.js";
    import { onMounted, onUnmounted, ref, watch } from "vue";

    Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

    const props = defineProps<{
        data: ChartData<"doughnut">;
        options?: ChartOptions<"doughnut">;
    }>();

    const canvas = ref<HTMLCanvasElement | null>(null);
    let chart: Chart<"doughnut"> | null = null;

    onMounted(() => {
        if (!canvas.value) {
            return;
        }

        chart = new Chart(canvas.value, {
            type: "doughnut",
            data: props.data,
            options: props.options,
        });
    });

    watch(
        () => props.data,
        (newData) => {
            if (!chart) {
                return;
            }

            chart.data = newData;
            chart.update();
        },
        { deep: true }
    );

    onUnmounted(() => {
        chart?.destroy();
        chart = null;
    });
</script>

<template>
    <canvas ref="canvas"></canvas>
</template>
