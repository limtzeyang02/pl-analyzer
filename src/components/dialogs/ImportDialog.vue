<script setup lang="ts">
    import { ref } from "vue";
    import type { ImportFieldDef } from "@/types";
    import { useXlsx } from "@/composables/useXlsx";
    import {
        Dialog,
        DialogContent,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "@/components/ui/dialog";
    import { Button } from "@/components/ui/button";
    import { Label } from "@/components/ui/label";

    const props = defineProps<{
        title: string;
        fields: ImportFieldDef[];
        worksheet: string;
    }>();

    const open = defineModel<boolean>("open");

    const emit = defineEmits<{
        submit: [records: Record<string, unknown>[]];
    }>();

    const { parseFile } = useXlsx();

    const fileInput = ref<HTMLInputElement | null>(null);
    const selectedFile = ref<(File & { data: ArrayBuffer }) | null>(null);
    const fileName = ref<string>("");

    async function onFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const buffer = await file.arrayBuffer();
        // Attach the ArrayBuffer so parseFile can read it.
        const fileWithData = file as File & { data: ArrayBuffer };
        fileWithData.data = buffer;
        selectedFile.value = fileWithData;
        fileName.value = file.name;
    }

    function handleSubmit() {
        if (!selectedFile.value) return;

        const records = parseFile(
            selectedFile.value,
            props.fields,
            { worksheet: props.worksheet }
        );

        emit("submit", records);
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
                <div class="flex flex-col gap-1.5">
                    <Label for="import-file">Excel File</Label>
                    <div class="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            @click="fileInput?.click()"
                        >
                            Browse
                        </Button>
                        <span class="text-sm text-muted-foreground">
                            {{ fileName || "No file selected" }}
                        </span>
                    </div>
                    <!-- hidden native file input; only .xlsx/.xls accepted -->
                    <input
                        id="import-file"
                        ref="fileInput"
                        type="file"
                        accept=".xlsx,.xls"
                        class="sr-only"
                        @change="onFileChange"
                    />
                </div>

                <DialogFooter>
                    <Button type="submit" :disabled="!selectedFile">Import</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
</template>
