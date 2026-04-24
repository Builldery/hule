import { onBeforeUnmount, ref, watch, type Ref, type ShallowRef } from 'vue'
import type { Timeline } from 'vis-timeline/standalone'
import { DAY_MS } from '@hule/utils'
import {
  GHOST_HEIGHT,
  AXIS_VMARGIN,
  ROW_STRIDE,
  slotOccupied,
} from '../classes/GanttSlotResolver'

export interface UseGanttGhostBarOptions {
  mountRef: Ref<HTMLDivElement | null>
  timeline: ShallowRef<Timeline | null>
  popoverOpen: Ref<boolean>
}

export interface UseGanttGhostBarReturn {
  ghostVisible: Ref<boolean>
  ghostLeft: Ref<number>
  ghostTop: Ref<number>
  ghostWidth: Ref<number>
  ghostDay: Ref<Date | null>
  ghostEl: Ref<HTMLDivElement | null>
  attach(): void
  detach(): void
  hideGhost(): void
}

/** Ghost-bar tracking: the bar follows the cursor snapped to day columns and
 *  to the vis-timeline row grid; hides over real bars/axis; stays pinned while
 *  the quick-add popover is open. Returns helpers to attach/detach listeners. */
export function useGanttGhostBar(opts: UseGanttGhostBarOptions): UseGanttGhostBarReturn {
  const ghostVisible = ref(false)
  const ghostLeft = ref(0)
  const ghostTop = ref(0)
  const ghostWidth = ref(0)
  const ghostDay = ref<Date | null>(null)
  const ghostEl = ref<HTMLDivElement | null>(null)

  function hideGhost(): void {
    // Keep the ghost pinned while the popover is open so it doesn't flicker
    // off when the cursor moves into the popover input.
    if (opts.popoverOpen.value) return
    ghostVisible.value = false
    ghostDay.value = null
  }

  function onMouseMove(e: MouseEvent): void {
    if (!opts.timeline.value || !opts.mountRef.value) return
    if (opts.popoverOpen.value) return

    const target = e.target as HTMLElement | null
    if (!target) return hideGhost()
    if (target.closest('.vis-item')) return hideGhost()
    if (target.closest('.vis-time-axis')) return hideGhost()

    const centerPanel = opts.mountRef.value.querySelector<HTMLElement>('.vis-panel.vis-center')
    if (!centerPanel) return hideGhost()

    const cRect = centerPanel.getBoundingClientRect()
    if (e.clientX < cRect.left || e.clientX > cRect.right) return hideGhost()
    if (e.clientY < cRect.top || e.clientY > cRect.bottom) return hideGhost()

    const win = opts.timeline.value.getWindow()
    const winStart = win.start.valueOf()
    const winEnd = win.end.valueOf()
    const windowMs = winEnd - winStart
    if (windowMs <= 0) return hideGhost()

    const pxPerMs = cRect.width / windowMs
    const ratio = (e.clientX - cRect.left) / cRect.width
    const cursorMs = winStart + ratio * windowMs
    const day = new Date(cursorMs)
    day.setHours(0, 0, 0, 0)

    const mRect = opts.mountRef.value.getBoundingClientRect()
    const dayLeftMount = cRect.left - mRect.left + (day.getTime() - winStart) * pxPerMs
    const dayWidth = DAY_MS * pxPerMs
    const dayLeftVp = mRect.left + dayLeftMount
    const dayRightVp = dayLeftVp + dayWidth

    const cursorPanelY = e.clientY - cRect.top
    const offsetFromAxis = cursorPanelY - AXIS_VMARGIN
    let slot = Math.max(0, Math.floor(offsetFromAxis / ROW_STRIDE))
    // Hide inside the 10px inter-row margin — otherwise floor() maps the cursor
    // to the previous slot and the ghost drifts onto a real bar.
    const offsetWithinSlot = offsetFromAxis - slot * ROW_STRIDE
    if (offsetFromAxis < 0 || offsetWithinSlot >= GHOST_HEIGHT) return hideGhost()
    const maxSlot = Math.max(0, Math.floor((cRect.height - AXIS_VMARGIN - GHOST_HEIGHT) / ROW_STRIDE))

    // Walk down to the first unoccupied slot so the ghost never lands on an
    // existing bar in the same day column.
    const bars = opts.mountRef.value.querySelectorAll<HTMLElement>('.vis-item.hule-bar')
    while (slot <= maxSlot && slotOccupied(bars, cRect, dayLeftVp, dayRightVp, slot)) {
      slot++
    }
    const slotPanelTop = AXIS_VMARGIN + slot * ROW_STRIDE
    const maxSlotTop = cRect.height - GHOST_HEIGHT - 4

    // Match the 5px inset used by .hule-bar::before so ghost aligns with bars.
    ghostLeft.value = dayLeftMount + 5
    ghostWidth.value = dayWidth - 10
    ghostTop.value = cRect.top - mRect.top + Math.min(maxSlotTop, slotPanelTop)
    ghostDay.value = day
    ghostVisible.value = true
  }

  function attach(): void {
    const mount = opts.mountRef.value
    if (!mount) return
    mount.addEventListener('mousemove', onMouseMove)
    mount.addEventListener('mouseleave', hideGhost)
  }

  function detach(): void {
    const mount = opts.mountRef.value
    if (!mount) return
    mount.removeEventListener('mousemove', onMouseMove)
    mount.removeEventListener('mouseleave', hideGhost)
  }

  // Re-attach when the mount element first appears.
  watch(() => opts.mountRef.value, el => { if (el) attach() })

  // Hide the ghost on timeline pan/zoom — its mount-space position is computed
  // from the current window and goes stale the moment the range shifts.
  watch(() => opts.timeline.value, (tl, _prev, onCleanup) => {
    if (!tl) return
    tl.on('rangechange', hideGhost)
    onCleanup(() => tl.off('rangechange', hideGhost))
  })

  onBeforeUnmount(detach)

  return { ghostVisible, ghostLeft, ghostTop, ghostWidth, ghostDay, ghostEl, attach, detach, hideGhost }
}
