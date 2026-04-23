import type { Ref, ShallowRef } from 'vue'
import type { Timeline } from 'vis-timeline/standalone'
import { noonToday } from '../classes/GanttWindowCalculator'

/** Paints the custom "today" vertical line at noon (so it bisects the current
 *  day column) and keeps it aligned below the axis by exposing the axis height
 *  as `--axis-h` on the mount element. */
export function useTodayMarker(
  timeline: ShallowRef<Timeline | null>,
  mountRef: Ref<HTMLDivElement | null>,
): { install: () => void } {
  function syncAxisHeight(): void {
    const root = mountRef.value
    if (!root) return
    const center = root.querySelector<HTMLElement>('.vis-panel.vis-center')
    const vertBg = root.querySelector<HTMLElement>('.vis-panel.vis-background.vis-vertical')
    if (!center || !vertBg) return
    const h = center.getBoundingClientRect().top - vertBg.getBoundingClientRect().top
    if (h > 0) root.style.setProperty('--axis-h', `${h}px`)
  }

  function install(): void {
    const tl = timeline.value
    if (!tl) return
    tl.addCustomTime(noonToday(), 'hule-today')
    tl.on('changed', syncAxisHeight)
    requestAnimationFrame(syncAxisHeight)
  }

  return { install }
}
