import { ref } from 'vue'
import type { DateRange } from '@/types'

interface UseDateRangeOptions {
    fetchRange: () => Promise<DateRange>
}

function computeDefaultRange(min: Date | null, max: Date | null): [Date | null, Date | null] {
    if (!min || !max) return [null, null]
    const startOfYear = new Date(max.getFullYear(), 0, 1)
    return [startOfYear < min ? min : startOfYear, max]
}

export function useDateRange(options: UseDateRangeOptions) {
    const period = ref<[Date | null, Date | null]>([null, null])
    const range = ref<[Date | null, Date | null]>([null, null])
    const isInitializing = ref(false)

    async function init() {
        isInitializing.value = true
        const { min, max } = await options.fetchRange()
        period.value = [min, max]
        range.value = computeDefaultRange(min, max)
        isInitializing.value = false
    }

    return { period, range, init, isInitializing }
}
