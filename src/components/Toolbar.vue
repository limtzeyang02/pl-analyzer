<script setup lang="ts"></script>

<template>
    <section
        class="flex flex-wrap items-center justify-between gap-2 rounded-3xl border bg-sidebar p-3 shadow-sm"
    >
        <div class="flex items-center">
            <slot name="start"></slot>
        </div>
        <div class="flex items-center">
            <slot name="center"></slot>
        </div>
        <div class="flex items-center">
            <slot name="end"></slot>
        </div>
    </section>
</template>
