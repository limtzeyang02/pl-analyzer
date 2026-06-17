<script setup lang="ts">
    import type { ChartData, ChartOptions } from "chart.js";
    import {
        CategoryScale,
        Chart,
        Legend,
        LinearScale,
        LineElement,
        PointElement,
        Title,
        Tooltip,
        LineController,
    } from "chart.js";
    import { onMounted, onUnmounted, ref, watch } from "vue";

    Chart.register(
        LineController,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend
    );

    const props = defineProps<{
        data: ChartData<"line">;
        options?: ChartOptions<"line">;
    }>();

    const canvas = ref<HTMLCanvasElement | null>(null);
    let chart: Chart<"line"> | null = null;

    onMounted(() => {
        if (!canvas.value) {
            return;
        }

        chart = new Chart(canvas.value, {
            type: "line",
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
