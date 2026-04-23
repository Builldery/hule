<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  UiButtonGroup,
  UiRadioGroup,
  UiRadioButton,
} from '@buildery/ui-kit/components'
import { useListsStore } from '@/list/store/useListsStore'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import TaskListMode from '@/task/components/TaskListMode.vue'
import KanbanBoard from '@/kanban/components/KanbanBoard.vue'
import GanttView from '@/timeline/views/GanttView.vue'

type Mode = 'list' | 'kanban' | 'timeline'
const MODES: readonly Mode[] = ['list', 'kanban', 'timeline'] as const

const props = defineProps<{ spaceId: string; listId: string }>()

const route = useRoute()
const router = useRouter()
const spacesStore = useSpacesStore()
const listsStore = useListsStore()

const list = computed(() => listsStore.byId[props.listId])
const space = computed(() => spacesStore.byId[props.spaceId])

function parseMode(v: unknown): Mode {
  return typeof v === 'string' && (MODES as readonly string[]).includes(v)
    ? (v as Mode)
    : 'list'
}

const mode = computed<Mode>({
  get: () => parseMode(route.query.view),
  set: (v) => {
    const query = { ...route.query, view: v === 'list' ? undefined : v }
    void router.replace({ name: 'list', params: route.params, query })
  },
})

const modes: { label: string; value: Mode }[] = [
  { label: 'List', value: 'list' },
  { label: 'Kanban', value: 'kanban' },
  { label: 'Timeline', value: 'timeline' },
]

onMounted(() => {
  void listsStore.loadForSpace(props.spaceId)
})
watch(() => props.spaceId, (id) => {
  void listsStore.loadForSpace(id)
})
</script>

<template>
  <div v-if="list" class="list-view" :class="'mode-' + mode">
    <header class="page-head">
      <div class="breadcrumb muted">{{ space?.name }} /</div>
      <div class="row spaced">
        <h1>{{ list.name }}</h1>
        <UiButtonGroup>
          <UiRadioGroup :value="mode" @update:value="(v: unknown) => mode = parseMode(v)">
            <UiRadioButton
              v-for="m in modes"
              :key="m.value"
              :value="m.value"
              :label="m.label"
              size="small"
            />
          </UiRadioGroup>
        </UiButtonGroup>
      </div>
    </header>

    <div class="mode-body">
      <TaskListMode v-if="mode === 'list'" :list-id="props.listId" />
      <KanbanBoard v-else-if="mode === 'kanban'" :list-id="props.listId" />
      <GanttView v-else-if="mode === 'timeline'" :list-id="props.listId" />
    </div>
  </div>
  <div v-else-if="listsStore.getFor(props.spaceId).length > 0" class="muted">List not found.</div>
  <div v-else class="muted">Loading…</div>
</template>

<style scoped>
.list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.page-head {
  padding: 24px 32px 16px;
  flex-shrink: 0;
}
.breadcrumb { font-size: 13px; margin-bottom: 2px; }
.row.spaced { justify-content: space-between; align-items: center; }
h1 { margin: 0; font-size: 24px; font-weight: 600; }

.mode-body {
  flex: 1;
  min-height: 0;
  padding: 0 32px 24px;
  overflow: auto;
}
.mode-timeline .mode-body {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.mode-kanban .mode-body {
  overflow: auto;
}
</style>
