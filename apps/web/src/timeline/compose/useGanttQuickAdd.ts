import { ref, type Ref } from 'vue'
import type { AutoCompleteCompleteEvent, AutoCompleteOptionSelectEvent } from 'primevue/autocomplete'
import type { Task } from '@hule/types'
import { useTasksStore } from '@/task/store/useTasksStore'

export interface UseGanttQuickAddOptions {
  listId: Ref<string>
}

export interface UseGanttQuickAddReturn {
  popoverDay: Ref<Date | null>
  popoverOpen: Ref<boolean>
  activeTab: Ref<'find' | 'create'>
  findQuery: Ref<string>
  findSuggestions: Ref<Task[]>
  newTitle: Ref<string>
  creating: Ref<boolean>
  prepareOpen(day: Date): void
  close(): void
  searchTasks(ev: AutoCompleteCompleteEvent): void
  onFindFocus(): void
  onFindSelect(ev: AutoCompleteOptionSelectEvent): Promise<void>
  createTask(): Promise<void>
}

/** Quick-add popover state: Find (attach an undated task to the ghost day)
 *  or Create (spawn a new task anchored to the ghost day). Open/close is now
 *  driven declaratively by UiPopover via `popoverOpen`; `prepareOpen(day)`
 *  snapshots the day before the trigger click toggles `popoverOpen` on. */
export function useGanttQuickAdd(opts: UseGanttQuickAddOptions): UseGanttQuickAddReturn {
  const tasksStore = useTasksStore()
  const popoverDay = ref<Date | null>(null)
  const popoverOpen = ref(false)
  const activeTab = ref<'find' | 'create'>('create')
  const findQuery = ref('')
  const findSuggestions = ref<Task[]>([])
  const newTitle = ref('')
  const creating = ref(false)

  function dayRange(day: Date): { startISO: string; endISO: string } {
    const start = new Date(day)
    start.setHours(0, 0, 0, 0)
    const iso = start.toISOString()
    return { startISO: iso, endISO: iso }
  }

  function filterTasks(query: string): void {
    const q = query.trim().toLowerCase()
    const pool = tasksStore
      .getForList(opts.listId.value)
      .filter(t => !t.startDate || !t.dueDate)
    findSuggestions.value = q
      ? pool.filter(t => t.title.toLowerCase().includes(q)).slice(0, 20)
      : pool.slice(0, 20)
  }

  function prepareOpen(day: Date): void {
    popoverDay.value = day
    activeTab.value = 'create'
    findQuery.value = ''
    findSuggestions.value = []
    newTitle.value = ''
  }

  function close(): void {
    popoverOpen.value = false
    popoverDay.value = null
    findQuery.value = ''
    findSuggestions.value = []
    newTitle.value = ''
  }

  function searchTasks(ev: AutoCompleteCompleteEvent): void {
    filterTasks(ev.query)
  }

  function onFindFocus(): void {
    filterTasks('')
  }

  async function onFindSelect(ev: AutoCompleteOptionSelectEvent): Promise<void> {
    const task = ev.value as Task
    if (!popoverDay.value) return
    const { startISO, endISO } = dayRange(popoverDay.value)
    await tasksStore.update(task.id, { startDate: startISO, dueDate: endISO })
    close()
  }

  async function createTask(): Promise<void> {
    const title = newTitle.value.trim()
    if (!title || !popoverDay.value || creating.value) return
    creating.value = true
    try {
      const { startISO, endISO } = dayRange(popoverDay.value)
      await tasksStore.create({
        listId: opts.listId.value,
        title,
        startDate: startISO,
        dueDate: endISO,
      })
      close()
    } finally {
      creating.value = false
    }
  }

  return {
    popoverDay, popoverOpen, activeTab, findQuery, findSuggestions, newTitle, creating,
    prepareOpen, close, searchTasks, onFindFocus, onFindSelect, createTask,
  }
}
