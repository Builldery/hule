export const STATUS_OPTIONS = [
    { value: 'todo', label: 'To Do', color: 'var(--status-todo)' },
    { value: 'in_progress', label: 'In Progress', color: 'var(--status-in-progress)' },
    { value: 'done', label: 'Done', color: 'var(--status-done)' },
];
export const PRIORITY_OPTIONS = [
    { value: 'none', label: 'None', color: 'transparent', icon: 'pi-minus' },
    { value: 'low', label: 'Low', color: 'var(--priority-low)', icon: 'pi-flag' },
    { value: 'normal', label: 'Normal', color: 'var(--priority-normal)', icon: 'pi-flag' },
    { value: 'high', label: 'High', color: 'var(--priority-high)', icon: 'pi-flag-fill' },
    { value: 'urgent', label: 'Urgent', color: 'var(--priority-urgent)', icon: 'pi-flag-fill' },
];
export function statusMeta(v) {
    return STATUS_OPTIONS.find(s => s.value === v) ?? { value: v, label: v, color: 'var(--status-todo)' };
}
export function priorityMeta(v) {
    return PRIORITY_OPTIONS.find(p => p.value === v) ?? PRIORITY_OPTIONS[0];
}
