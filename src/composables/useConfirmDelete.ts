import { ref } from 'vue'

export function useConfirmDelete(options: {
    message: string
    onConfirm: () => Promise<void>
}) {
    const isOpen = ref(false)
    function open() { isOpen.value = true }
    async function confirm() { await options.onConfirm(); isOpen.value = false }
    function cancel() { isOpen.value = false }
    return { isOpen, open, confirm, cancel }
}
