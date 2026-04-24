import { watch, type Ref, type ShallowRef } from 'vue'
import type { Timeline } from 'vis-timeline/standalone'
import { windowForMode, type ViewMode, VIEW_MODES } from '../classes/GanttWindowCalculator'

export interface UseGanttViewModeReturn {
  viewModes: ViewMode[]
  applyViewMode(mode: ViewMode): void
  goToday(): void
  fitAll(): void
}

export function useGanttViewMode(
  timeline: ShallowRef<Timeline | null>,
  viewMode: Ref<ViewMode>,
): UseGanttViewModeReturn {
  function applyViewMode(mode: ViewMode, animate = false): void {
    const tl = timeline.value
    if (!tl) return
    const range = tl.getWindow()
    const center = new Date((range.start.valueOf() + range.end.valueOf()) / 2)
    const { start, end } = windowForMode(mode, center)
    tl.setWindow(start, end, animate
      ? { animation: { duration: 200, easingFunction: 'easeInOutQuad' } }
      : { animation: false })
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
    requestAnimationFrame(() => applyViewMode(mode, true))
  })

  return { viewModes: VIEW_MODES, applyViewMode, goToday, fitAll }
}
