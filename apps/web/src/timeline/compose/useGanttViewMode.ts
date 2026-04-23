import { ref, watch, type Ref, type ShallowRef } from 'vue'
import type { Timeline } from 'vis-timeline/standalone'
import { windowForMode, type ViewMode, VIEW_MODES } from '../classes/GanttWindowCalculator'

export interface UseGanttViewModeReturn {
  viewMode: Ref<ViewMode>
  viewModes: ViewMode[]
  applyViewMode(mode: ViewMode): void
  goToday(): void
  fitAll(): void
}

export function useGanttViewMode(timeline: ShallowRef<Timeline | null>): UseGanttViewModeReturn {
  const viewMode = ref<ViewMode>('Week')

  function applyViewMode(mode: ViewMode): void {
    const tl = timeline.value
    if (!tl) return
    const range = tl.getWindow()
    const center = new Date((range.start.valueOf() + range.end.valueOf()) / 2)
    const { start, end } = windowForMode(mode, center)
    tl.setWindow(start, end, { animation: false })
  }

  function goToday(): void {
    const tl = timeline.value
    if (!tl) return
    const { start, end } = windowForMode(viewMode.value, new Date())
    tl.setWindow(start, end, { animation: { duration: 200, easingFunction: 'easeInOutQuad' } })
  }

  function fitAll(): void {
    timeline.value?.fit({ animation: { duration: 200, easingFunction: 'easeInOutQuad' } })
  }

  watch(viewMode, mode => {
    if (!timeline.value) return
    applyViewMode(mode)
    requestAnimationFrame(() => applyViewMode(mode))
  })

  return { viewMode, viewModes: VIEW_MODES, applyViewMode, goToday, fitAll }
}
