<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  UiButton,
  UiInfo,
  UiInput,
  UiCombobox,
  UiListboxOption,
  UiRawInput,
  UiTreeView,
} from '@buildery/ui-kit/components'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import { useListsStore } from '@/list/store/useListsStore'
import { useTasksStore } from '@/task/store/useTasksStore'
import { STATUS_OPTIONS, PRIORITY_OPTIONS, statusMeta, priorityMeta } from '@/task/constants/tasks'
import TaskTreeNode from '@/task/components/TaskTreeNode.vue'
import CommentsFeed from '@/comment/components/CommentsFeed.vue'

const props = defineProps<{
  spaceId: string
  listId: string
  taskId: string
  /** When rendered inside a modal, hide breadcrumbs / back button and relax
   *  the full-page layout rules (no forced 100% height, no top padding). */
  modal?: boolean
}>()

const spacesStore = useSpacesStore()
const listsStore = useListsStore()
const tasksStore = useTasksStore()
const router = useRouter()

const space = computed(() => spacesStore.byId[props.spaceId])
const list = computed(() => listsStore.byId[props.listId])
const task = computed(() => tasksStore.byId[props.taskId])

const subtree = computed(() => {
  const all = tasksStore.getForList(props.listId)
  const root = all.find(t => t.id === props.taskId)
  if (!root) return []
  return [root, ...all.filter(t => t.path.includes(props.taskId))]
})

const children = computed(() =>
  subtree.value
    .filter(t => t.parentId === props.taskId)
    .sort((a, b) => a.order - b.order),
)

const editingTitle = ref(false)
const titleDraft = ref('')
watch(task, (t) => { if (t) titleDraft.value = t.title }, { immediate: true })

const descDraft = ref('')
watch(task, (t) => { if (t) descDraft.value = t.description ?? '' }, { immediate: true })

const newSubtaskTitle = ref('')
const addingSubtask = ref(false)

const statusLabel = (v: string): string => statusMeta(v).label
const priorityLabel = (v: string): string => priorityMeta(v).label

onMounted(async () => {
  void spacesStore.load()
  void listsStore.loadForSpace(props.spaceId)
  await tasksStore.loadForList(props.listId)
})
watch(() => props.listId, async id => { await tasksStore.loadForList(id) })

async function saveTitle(): Promise<void> {
  if (!task.value) return
  const v = titleDraft.value.trim()
  if (!v || v === task.value.title) {
    titleDraft.value = task.value.title
    editingTitle.value = false
    return
  }
  await tasksStore.update(props.taskId, { title: v })
  editingTitle.value = false
}

async function saveDescription(): Promise<void> {
  if (!task.value) return
  if ((task.value.description ?? '') === descDraft.value) return
  await tasksStore.update(props.taskId, { description: descDraft.value || null })
}

async function onStatusChange(v: string): Promise<void> {
  await tasksStore.update(props.taskId, { status: v })
}
async function onPriorityChange(v: string): Promise<void> {
  await tasksStore.update(props.taskId, { priority: v })
}
async function onStartDate(d: Date | null): Promise<void> {
  await tasksStore.update(props.taskId, { startDate: d ? d.toISOString() : null })
}
async function onDueDate(d: Date | null): Promise<void> {
  await tasksStore.update(props.taskId, { dueDate: d ? d.toISOString() : null })
}

async function addSubtask(): Promise<void> {
  if (addingSubtask.value) return
  const v = newSubtaskTitle.value.trim()
  if (!v) return
  addingSubtask.value = true
  try {
    await tasksStore.create({ listId: props.listId, parentId: props.taskId, title: v })
    newSubtaskTitle.value = ''
  } finally {
    addingSubtask.value = false
  }
}

function back(): void {
  // Prefer history-back so we return to whatever view the user came from
  // (keeps the ?view=kanban/timeline query they were on). Fall back to the
  // plain list route when there's no history entry (e.g. direct deep-link).
  const fromInternal = window.history.state?.back != null
  if (fromInternal) {
    router.back()
    return
  }
  void router.push({ name: 'list', params: { spaceId: props.spaceId, listId: props.listId } })
}

const startDateValue = computed({
  get: () => task.value?.startDate ? new Date(task.value.startDate) : null,
  set: () => {},
})
const dueDateValue = computed({
  get: () => task.value?.dueDate ? new Date(task.value.dueDate) : null,
  set: () => {},
})
</script>

<template>
  <div v-if="task" class="task-view" :class="{ modal: props.modal }">
    <header class="head">
      <div v-if="!props.modal" class="breadcrumb muted">
        <router-link :to="{ name: 'space', params: { spaceId: props.spaceId } }">{{ space?.name }}</router-link>
        /
        <router-link :to="{ name: 'list', params: { spaceId: props.spaceId, listId: props.listId } }">{{ list?.name }}</router-link>
      </div>
      <div class="title-row">
        <UiButton v-if="!props.modal" size="small" fill="text" color="gray" title="Back" @click="back">
          <i class="pi pi-arrow-left" aria-label="Back" />
        </UiButton>
        <div v-if="editingTitle" class="title-input">
          <UiRawInput
            :value="titleDraft"
            autofocus
            @update:value="(v: unknown) => titleDraft = String(v ?? '')"
            @keydown.enter.stop="saveTitle"
            @keydown.escape="() => { titleDraft = task!.title; editingTitle = false }"
            @blur="saveTitle"
          />
        </div>
        <h1 v-else @click="editingTitle = true">{{ task.title }}</h1>
      </div>
    </header>

    <section class="fields">
      <div class="field">
        <label>Status</label>
        <UiCombobox
          :value="task.status"
          :get-display-value="statusLabel"
          size="small"
          @update:value="onStatusChange"
        >
          <UiListboxOption
            v-for="o in STATUS_OPTIONS"
            :key="o.value"
            :value="o.value"
            :label="o.label"
          />
        </UiCombobox>
      </div>
      <div class="field">
        <label>Priority</label>
        <UiCombobox
          :value="task.priority"
          :get-display-value="priorityLabel"
          size="small"
          @update:value="onPriorityChange"
        >
          <UiListboxOption
            v-for="o in PRIORITY_OPTIONS"
            :key="o.value"
            :value="o.value"
          >
            <span class="prio-row">
              <i class="pi" :class="o.icon" :style="{ color: o.color }"></i>
              <span>{{ o.label }}</span>
            </span>
          </UiListboxOption>
        </UiCombobox>
      </div>
      <div class="field">
        <label>Start date</label>
        <DatePicker
          :model-value="startDateValue"
          show-icon
          show-button-bar
          size="small"
          @update:model-value="(v) => onStartDate(Array.isArray(v) ? (v[0] as Date | null) : (v as Date | null))"
        />
      </div>
      <div class="field">
        <label>Due date</label>
        <DatePicker
          :model-value="dueDateValue"
          show-icon
          show-button-bar
          size="small"
          @update:model-value="(v) => onDueDate(Array.isArray(v) ? (v[0] as Date | null) : (v as Date | null))"
        />
      </div>
    </section>

    <section class="section">
      <h2>Description</h2>
      <Textarea
        v-model="descDraft"
        auto-resize
        rows="3"
        placeholder="Add a description"
        class="desc"
        @blur="saveDescription"
      />
    </section>

    <section class="section">
      <h2>Subtasks <span class="muted count">({{ subtree.length - 1 }} total)</span></h2>
      <div class="add-subtask">
        <UiInput
          :value="newSubtaskTitle"
          placeholder="Add a subtask, press Enter"
          size="small"
          class="add-input"
          @update:value="(v: unknown) => newSubtaskTitle = String(v ?? '')"
          @keydown.enter.stop="addSubtask"
        />
      </div>
      <UiTreeView v-if="children.length > 0">
        <TaskTreeNode
          v-for="c in children"
          :key="c.id"
          :task="c"
          :all="subtree"
        />
      </UiTreeView>
      <UiInfo v-else>No subtasks yet.</UiInfo>
    </section>

    <section class="section">
      <h2>Activity</h2>
      <CommentsFeed :task-id="props.taskId" />
    </section>
  </div>
  <div v-else class="muted">Loading…</div>
</template>

<style scoped>
.task-view {
  max-width: 900px;
  padding: 24px 32px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}
/* In-modal: the Dialog provides its own padding/scroll, and we don't want
   the 100% height fight with the dialog's content wrapper. */
.task-view.modal {
  padding: 0;
  height: auto;
  overflow-y: visible;
  max-width: none;
}
.breadcrumb { font-size: 13px; margin-bottom: 4px; }
.breadcrumb a { color: inherit; text-decoration: none; }
.breadcrumb a:hover { text-decoration: underline; }
.title-row { display: flex; align-items: center; gap: 4px; }
h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  cursor: text;
  flex: 1;
  padding: 0 4px;
  border-radius: 4px;
}
h1:hover { background: var(--hover); }
.title-input { flex: 1; display: flex; }
.title-input :deep(input) {
  font-size: 26px;
  font-weight: 600;
  width: 100%;
  border: none;
  outline: none;
  background: var(--hover);
  border-radius: 4px;
  padding: 0 4px;
  font-family: inherit;
  color: inherit;
}
.fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin: 24px 0;
}
.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 12px; color: var(--text-muted); font-weight: 500; }
.section { margin: 24px 0; }
h2 { font-size: 14px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.4px; margin: 0 0 8px; }
.count { text-transform: none; letter-spacing: 0; font-weight: 400; }
.desc { width: 100%; }
.desc :deep(textarea) { width: 100%; }
.add-subtask { margin-bottom: 8px; }
.add-input { width: 100%; }
.add-input :deep(.p-inputtext) { width: 100%; }
.prio-row { display: inline-flex; align-items: center; gap: 6px; }
</style>
