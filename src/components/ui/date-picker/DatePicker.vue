<script setup lang="ts">
    import type { DateValue } from "@internationalized/date";
    import { getLocalTimeZone, today } from "@internationalized/date";
    import type { Ref } from "vue";
    import { ref } from "vue";
    import { CalendarIcon } from "@lucide/vue";
    import { cn, toDateString } from "@/lib/utils";
    import { Button } from "@/components/ui/button";
    import { Calendar } from "@/components/ui/calendar";
    import {
        Popover,
        PopoverContent,
        PopoverTrigger,
    } from "@/components/ui/popover";

    const defaultPlaceholder = today(getLocalTimeZone());
    const date = ref() as Ref<DateValue>;
</script>

<template>
    <Popover v-slot="{ close }">
        <PopoverTrigger as-child>
            <Button
                variant="outline"
                :class="
                    cn(
                        'w-60 justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                    )
                "
            >
                <CalendarIcon />
                {{
                    date
                        ? toDateString(date.toDate(getLocalTimeZone()))
                        : "Pick a date"
                }}
            </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0" align="start">
            <Calendar
                v-model="date"
                :default-placeholder="defaultPlaceholder"
                layout="month-and-year"
                initial-focus
                @update:model-value="close"
            />
        </PopoverContent>
    </Popover>
</template>
