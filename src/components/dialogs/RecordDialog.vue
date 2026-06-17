<script setup lang="ts">
    import { reactive, watch } from "vue";
    import type { FieldDef } from "@/types";
    import {
        Dialog,
        DialogContent,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "@/components/ui/dialog";
    import { Button } from "@/components/ui/button";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import {
        NumberField,
        NumberFieldContent,
        NumberFieldDecrement,
        NumberFieldIncrement,
        NumberFieldInput,
    } from "@/components/ui/number-field";
    import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from "@/components/ui/select";
    import { MONTH_OPTIONS } from "@/utils/format";

    const props = defineProps<{
        title: string;
        fields: FieldDef[];
        initialValues?: Record<string, unknown>;
    }>();

    const open = defineModel<boolean>("open");

    const emit = defineEmits<{
        submit: [values: Record<string, unknown>];
    }>();

    const formData = reactive<Record<string, unknown>>({});

    function seedForm() {
        for (const field of props.fields) {
            formData[field.id] = props.initialValues?.[field.id] ?? null;
        }
    }

    // Re-seed whenever initialValues change (e.g. edit vs. add).
    watch(() => props.initialValues, seedForm, { immediate: true, deep: true });

    function handleSubmit() {
        emit("submit", { ...formData });
        open.value = false;
    }
</script>

<template>
    <Dialog v-model:open="open">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ title }}</DialogTitle>
            </DialogHeader>

            <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
                <div v-for="field in fields" :key="field.id" class="flex flex-col gap-1.5">
                    <Label :for="field.id">{{ field.label }}</Label>

                    <!-- text -->
                    <Input
                        v-if="field.type === 'text'"
                        :id="field.id"
                        v-model="(formData[field.id] as string)"
                    />

                    <!-- currency -->
                    <NumberField
                        v-else-if="field.type === 'currency'"
                        :id="field.id"
                        v-model="(formData[field.id] as number)"
                        :min="field.min"
                        :max="field.max"
                        :format-options="{ style: 'currency', currency: 'MYR', minimumFractionDigits: 2, maximumFractionDigits: 2 }"
                    >
                        <NumberFieldContent>
                            <NumberFieldDecrement />
                            <NumberFieldInput />
                            <NumberFieldIncrement />
                        </NumberFieldContent>
                    </NumberField>

                    <!-- weight -->
                    <NumberField
                        v-else-if="field.type === 'weight'"
                        :id="field.id"
                        v-model="(formData[field.id] as number)"
                        :min="field.min"
                        :max="field.max"
                        :format-options="{ minimumFractionDigits: 2, maximumFractionDigits: 5 }"
                    >
                        <NumberFieldContent>
                            <NumberFieldDecrement />
                            <NumberFieldInput />
                            <NumberFieldIncrement />
                        </NumberFieldContent>
                    </NumberField>

                    <!-- year -->
                    <NumberField
                        v-else-if="field.type === 'year'"
                        :id="field.id"
                        v-model="(formData[field.id] as number)"
                        :min="field.min ?? 1900"
                        :max="field.max ?? 2100"
                        :format-options="{ useGrouping: false }"
                    >
                        <NumberFieldContent>
                            <NumberFieldDecrement />
                            <NumberFieldInput />
                            <NumberFieldIncrement />
                        </NumberFieldContent>
                    </NumberField>

                    <!-- month -->
                    <NativeSelect
                        v-else-if="field.type === 'month'"
                        :id="field.id"
                        v-model="(formData[field.id] as number)"
                    >
                        <NativeSelectOption
                            v-for="opt in MONTH_OPTIONS"
                            :key="opt.value"
                            :value="opt.value"
                        >
                            {{ opt.label }}
                        </NativeSelectOption>
                    </NativeSelect>

                    <!-- select -->
                    <Select
                        v-else-if="field.type === 'select'"
                        v-model="(formData[field.id] as string)"
                    >
                        <SelectTrigger :id="field.id" class="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem
                                v-for="opt in field.options"
                                :key="String(opt.value)"
                                :value="String(opt.value)"
                            >
                                {{ opt.label }}
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <!-- date -->
                    <input
                        v-else-if="field.type === 'date'"
                        :id="field.id"
                        v-model="(formData[field.id] as string)"
                        type="date"
                        class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <DialogFooter>
                    <Button type="submit">Save</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
</template>
