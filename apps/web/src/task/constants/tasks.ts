export interface StatusOption { value: string; label: string; color: string }
export interface PriorityOption { value: string; label: string; color: string; icon: string }

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'todo', label: 'To Do', color: 'var(--status-todo)' },
  { value: 'in_progress', label: 'In Progress', color: 'var(--status-in-progress)' },
  { value: 'done', label: 'Done', color: 'var(--status-done)' },
]

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { value: 'none', label: 'None', color: 'transparent', icon: 'pi-minus' },
  { value: 'low', label: 'Low', color: 'var(--priority-low)', icon: 'pi-flag' },
  { value: 'normal', label: 'Normal', color: 'var(--priority-normal)', icon: 'pi-flag' },
  { value: 'high', label: 'High', color: 'var(--priority-high)', icon: 'pi-flag-fill' },
  { value: 'urgent', label: 'Urgent', color: 'var(--priority-urgent)', icon: 'pi-flag-fill' },
]

export function statusMeta(v: string): StatusOption {
  return STATUS_OPTIONS.find(s => s.value === v) ?? { value: v, label: v, color: 'var(--status-todo)' }
}

export function priorityMeta(v: string): PriorityOption {
  return PRIORITY_OPTIONS.find(p => p.value === v) ?? PRIORITY_OPTIONS[0]
}
