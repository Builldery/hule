<script lang="ts">
export default { name: 'TaskTreeNode' }
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  UiButton,
  UiCombobox,
  UiListboxOption,
  UiRawInput,
  UiTreeViewItem,
} from '@buildery/ui-kit/components'
import type { Task } from '@hule/types'
import { STATUS_OPTIONS, statusMeta } from '@/task/constants/tasks'
import { useTasksStore } from '@/task/store/useTasksStore'
import { useListsStore } from '@/list/store/useListsStore'
import { useTaskModal } from '@/app/compose/useTaskModal'

const props = defineProps<{ task: Task; all: Task[] }>()

const tasksStore = useTasksStore()
const listsStore = useListsStore()
const taskModal = useTaskModal()

function open(): void {
  const list = listsStore.byId[props.task.listId]
  if (!list) return
  taskModal.open({ spaceId: list.spaceId, listId: list.id, taskId: props.task.id })
}

const children = computed(() =>
  props.all
    .filter(t => t.parentId === props.task.id)
    .sort((a, b) => a.order - b.order),
)

const doneCount = computed(() =>
  children.value.filter(c => c.status === 'done').length,
)

const addingSubtask = ref(false)
const subtaskTitle = ref('')
const submittingSubtask = ref(false)
const editing = ref(false)
const titleDraft = ref(props.task.title)
watch(() => props.task.title, v => { titleDraft.value = v })

async function saveTitle(): Promise<void> {
  const v = titleDraft.value.trim()
  if (!v || v === props.task.title) {
    titleDraft.value = props.task.title
    editing.value = false
    return
  }
  await tasksStore.update(props.task.id, { title: v })
  editing.value = false
}

async function toggleDone(): Promise<void> {
  const next = props.task.status === 'done' ? 'todo' : 'done'
  await tasksStore.update(props.task.id, { status: next })
}

async function onStatusChange(v: string): Promise<void> {
  await tasksStore.update(props.task.id, { status: v })
}

async function addSubtask(): Promise<void> {
  if (submittingSubtask.value) return
  const v = subtaskTitle.value.trim()
  if (!v) { addingSubtask.value = false; return }
  submittingSubtask.value = true
  try {
    await tasksStore.create({
      listId: props.task.listId,
      parentId: props.task.id,
      title: v,
    })
    subtaskTitle.value = ''
    addingSubtask.value = false
  } finally {
    submittingSubtask.value = false
  }
}

async function remove(): Promise<void> {
  await tasksStore.remove(props.task.id)
}

const statusLabel = (v: string): string => statusMeta(v).label

// UiTreeViewItem decides whether to render the `#children` slot based on
// `!!useSlots().children` inside its setup — which is NOT reactive to slot
// presence changes. Toggling a `v-if` on `<template #children>` therefore
// doesn't trigger a re-eval of `hasChildren`. We work around it by keying
// the item on the two distinct states (container vs leaf): when the user
// clicks "+" on a leaf, the key flips and Vue remounts UiTreeViewItem with
// the slot genuinely present, and its internal setup captures it correctly.
const itemKey = computed(() =>
  (children.value.length > 0 || addingSubtask.value) ? 'container' : 'leaf',
)
</script>

<template>
  <UiTreeViewItem :key="itemKey" :node-key="`task-${task.id}`" :default-open="true">
    <template #marker="{ isOpen, hasChildren, toggle }">
      <i
        v-if="hasChildren"
        class="pi chev-icon"
        :class="isOpen ? 'pi-chevron-down' : 'pi-chevron-right'"
        @click.stop="toggle"
      />
    </template>

    <template #default>
      <div class="tree-row" :class="{ done: task.status === 'done' }">
        <button class="check" :class="{ checked: task.status === 'done' }" @click="toggleDone">
          <i v-if="task.status === 'done'" class="pi pi-check"></i>
        </button>

        <div v-if="editing" class="title-input">
          <UiRawInput
            :value="titleDraft"
            autofocus
            @update:value="(v: unknown) => titleDraft = String(v ?? '')"
            @keydown.enter.stop="saveTitle"
            @keydown.escape="() => { titleDraft = props.task.title; editing = false }"
            @blur="saveTitle"
          />
        </div>
        <span v-else class="title" @click="editing = true">{{ task.title }}</span>

        <span v-if="children.length > 0" class="count muted">{{ doneCount }}/{{ children.length }}</span>

        <UiCombobox
          :value="task.status"
          :get-display-value="statusLabel"
          size="small"
          class="status-combo"
          :style="{ '--status-color': statusMeta(task.status).color }"
          @update:value="onStatusChange"
        >
          <UiListboxOption
            v-for="o in STATUS_OPTIONS"
            :key="o.value"
            :value="o.value"
            :label="o.label"
          />
        </UiCombobox>

        <UiButton size="small" fill="text" color="gray" class="act" title="Add subtask" @click="addingSubtask = true">
          <i class="pi pi-plus" aria-label="Add subtask" />
        </UiButton>
        <UiButton size="small" fill="text" color="gray" class="act" title="Open task" @click="open">
          <i class="pi pi-arrow-up-right" aria-label="Open task" />
        </UiButton>
        <UiButton size="small" fill="text" color="gray" class="act" title="Delete" @click="remove">
          <i class="pi pi-trash" aria-label="Delete" />
        </UiButton>
      </div>
    </template>

    <template v-if="children.length > 0 || addingSubtask" #children>
      <div v-if="addingSubtask" class="add-child">
        <UiRawInput
          :value="subtaskTitle"
          placeholder="Subtask title"
          autofocus
          @update:value="(v: unknown) => subtaskTitle = String(v ?? '')"
          @keydown.enter.stop="addSubtask"
          @keydown.escape="() => { subtaskTitle = ''; addingSubtask = false }"
          @blur="addSubtask"
        />
      </div>
      <TaskTreeNode
        v-for="c in children"
        :key="c.id"
        :task="c"
        :all="all"
      />
    </template>
  </UiTreeViewItem>
</template>

<style scoped>
.tree-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  flex: 1;
}
.chev-icon {
  font-size: 10px;
  color: var(--text-muted);
  cursor: pointer;
}
.check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--text-muted);
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
  flex-shrink: 0;
}
.check.checked { background: var(--status-done); border-color: var(--status-done); color: white; }
.check i { font-size: 10px; }
.title { cursor: text; padding: 2px 4px; border-radius: 3px; flex: 1; }
.title:hover { background: var(--hover); }
.done .title { text-decoration: line-through; color: var(--text-muted); }
.title-input { flex: 1; display: flex; }
.title-input :deep(input) {
  width: 100%;
  padding: 2px 4px;
  border: none;
  outline: none;
  background: var(--hover);
  border-radius: 3px;
  font: inherit;
  color: inherit;
}
.count { font-size: 12px; }
.status-combo { width: 140px; }
.status-combo :deep(.input-wrapper) {
  border-color: var(--status-color, var(--border));
}
.act { opacity: 0; transition: opacity 0.1s; }
.tree-row:hover .act { opacity: 1; }
.add-child {
  padding: 4px 0 4px 32px;
  display: flex;
}
.add-child :deep(input) {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  outline: none;
  font: inherit;
  color: inherit;
  background: var(--bg);
}
.add-child :deep(input:focus) { border-color: var(--accent-primary); }
</style>
