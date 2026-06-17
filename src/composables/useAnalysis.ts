import { ref, watch, onMounted } from 'vue'
import type { TransactionType, ComparisonRecord } from '@/types'
import { useDateRange } from '@/composables/useDateRange'
import { getOverviewRange, getPeriodComparison } from '@/service/analysis'

export function useAnalysis(type: TransactionType) {
    const { period, init, isInitializing } = useDateRange({ fetchRange: getOverviewRange })
    const comparisonData = ref<ComparisonRecord[]>([])
    const isLoading = ref(false)
    const range1 = ref<[Date | null, Date | null]>([null, null])
    const range2 = ref<[Date | null, Date | null]>([null, null])

    async function loadComparison() {
        if (!range1.value[0] || !range1.value[1] || !range2.value[0] || !range2.value[1]) return
        isLoading.value = true
        comparisonData.value = await getPeriodComparison(
            type,
            range1.value as [Date, Date],
            range2.value as [Date, Date]
        )
        isLoading.value = false
    }

    onMounted(() => init().then(loadComparison))
    watch([range1, range2], loadComparison)

    return { period, range1, range2, comparisonData, isLoading, isInitializing }
}
