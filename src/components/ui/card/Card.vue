<script setup lang="ts">
    import type { HTMLAttributes } from "vue";
    import { cn } from "@/lib/utils";

    const props = withDefaults(
        defineProps<{
            class?: HTMLAttributes["class"];
            size?: "default" | "sm";
        }>(),
        {
            size: "default",
        }
    );
</script>

<template>
    <div
        data-slot="card"
        :data-size="size"
        :class="
            cn(
                'group/card flex flex-col gap-6 overflow-hidden rounded-4xl bg-card py-6 text-sm text-card-foreground shadow-md ring-1 ring-foreground/5 has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 dark:ring-foreground/10 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl',
                props.class
            )
        "
    >
        <slot />
    </div>
</template>
