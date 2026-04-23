export const GHOST_HEIGHT = 28
// Must match vis-timeline `margin: { item: 10, axis: 16 }` — the ghost snaps to
// the same row grid as real items so it slots cleanly instead of drifting and
// clipping neighbours.
export const ITEM_VMARGIN = 10
export const AXIS_VMARGIN = 16
export const ROW_STRIDE = GHOST_HEIGHT + ITEM_VMARGIN

/** True if any bar whose X-range overlaps [dayLeftVp, dayRightVp] already
 *  occupies the row at the given slot (Y band). EPS absorbs subpixel drift. */
export function slotOccupied(
  bars: NodeListOf<HTMLElement>,
  cRect: DOMRect,
  dayLeftVp: number,
  dayRightVp: number,
  slot: number,
): boolean {
  const EPS = 2
  const slotTop = cRect.top + AXIS_VMARGIN + slot * ROW_STRIDE
  const slotBottom = slotTop + GHOST_HEIGHT
  for (const bar of bars) {
    const br = bar.getBoundingClientRect()
    if (br.right <= dayLeftVp + EPS || br.left >= dayRightVp - EPS) continue
    if (br.bottom <= slotTop || br.top >= slotBottom) continue
    return true
  }
  return false
}
