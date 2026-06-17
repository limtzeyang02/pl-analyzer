import { ref, watch, onMounted } from 'vue'
import type { Interval, OverviewRecord, BreakdownRecord } from '@/types'
import { useDateRange } from '@/composables/useDateRange'
import { getOverviewRange, getOverview, getOverviewBreakdown } from '@/service/analysis'

export function useOverview() {
    const interval = ref<Interval>('Monthly')
    const { period, range, init, isInitializing } = useDateRange({ fetchRange: getOverviewRange })
    const data = ref<OverviewRecord[]>([])
    const breakdownData = ref<BreakdownRecord[]>([])
    const isLoading = ref(false)
    let loadId = 0

    async function load() {
        const id = ++loadId
        isLoading.value = true
        const [overview, breakdown] = await Promise.all([
            getOverview(interval.value, { min: range.value[0], max: range.value[1] }),
            getOverviewBreakdown(interval.value, { min: range.value[0], max: range.value[1] })
        ])
        if (id !== loadId) return  // discard stale response
        data.value = overview
        breakdownData.value = breakdown
        isLoading.value = false
    }

    onMounted(() => init().then(load))
    watch([interval, range], load)

    return { interval, period, range, data, breakdownData, isLoading, isInitializing }
}
