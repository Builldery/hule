<script setup lang="ts">
import { ref } from 'vue'
import Popover from 'primevue/popover'
import AutoComplete, { type AutoCompleteCompleteEvent, type AutoCompleteOptionSelectEvent } from 'primevue/autocomplete'
import { UiButton, UiInput } from '@buildery/ui-kit/components'
import type { Task } from '@hule/types'

defineProps<{
  popoverDay: Date | null
  activeTab: 'find' | 'create'
  findQuery: string
  findSuggestions: Task[]
  newTitle: string
  creating: boolean
}>()

const emit = defineEmits<{
  'update:activeTab': ['find' | 'create']
  'update:findQuery': [string]
  'update:newTitle': [string]
  hide: []
  complete: [AutoCompleteCompleteEvent]
  findFocus: []
  findSelect: [AutoCompleteOptionSelectEvent]
  createTask: []
}>()

const popoverRef = ref<InstanceType<typeof Popover> | null>(null)

defineExpose({
  show: (e: Event, target?: unknown) => popoverRef.value?.show(e, target),
  hide: () => popoverRef.value?.hide(),
})
</script>

<template>
  <Popover ref="popoverRef" append-to="body" @hide="emit('hide')">
    <div class="qa">
      <div class="qa-tabs">
        <button
          class="qa-tab"
          :class="{ active: activeTab === 'find' }"
          @click="emit('update:activeTab', 'find')"
        >Find Task</button>
        <button
          class="qa-tab"
          :class="{ active: activeTab === 'create' }"
          @click="emit('update:activeTab', 'create')"
        >Create Task</button>
        <span class="qa-spacer" />
        <span v-if="popoverDay" class="qa-date muted">
          {{ popoverDay.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) }}
        </span>
      </div>

      <div v-if="activeTab === 'find'" class="qa-body">
        <AutoComplete
          :model-value="findQuery"
          :suggestions="findSuggestions"
          option-label="title"
          placeholder="Search undated tasks"
          size="small"
          class="qa-input"
          :min-length="0"
          force-selection
          @update:model-value="v => emit('update:findQuery', v as string)"
          @complete="ev => emit('complete', ev)"
          @option-select="ev => emit('findSelect', ev)"
          @focus="emit('findFocus')"
        />
      </div>
      <div v-else class="qa-body">
        <UiInput
          :value="newTitle"
          placeholder="Task name"
          size="small"
          autofocus
          class="qa-input"
          @update:value="(v: unknown) => emit('update:newTitle', String(v ?? ''))"
          @keydown.enter="emit('createTask')"
        />
        <UiButton
          label="Create Task"
          size="small"
          color="blue"
          fill="filled"
          :disabled="!newTitle.trim() || creating"
          @click="emit('createTask')"
        />
      </div>
    </div>
  </Popover>
</template>

<style scoped>
.qa { min-width: 280px; display: flex; flex-direction: column; gap: 10px; }
.qa-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  margin: 0 -4px;
  padding: 0 4px;
}
.qa-tab {
  background: transparent;
  border: none;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.qa-tab:hover { color: var(--text); }
.qa-tab.active {
  color: var(--text);
  border-bottom-color: var(--accent-primary);
}
.qa-spacer { flex: 1; }
.qa-date { font-size: 12px; }
.qa-body { display: flex; flex-direction: column; gap: 8px; }
.qa-input { width: 100%; }
.qa-input :deep(.p-inputtext) { width: 100%; }
.qa-input :deep(.p-autocomplete-input) { width: 100%; }
</style>
