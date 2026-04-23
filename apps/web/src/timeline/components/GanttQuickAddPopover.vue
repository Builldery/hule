<script setup lang="ts">
import AutoComplete, { type AutoCompleteCompleteEvent, type AutoCompleteOptionSelectEvent } from 'primevue/autocomplete'
import { UiButton, UiCard, UiInput } from '@buildery/ui-kit/components'
import type { Task } from '@hule/types'

const props = defineProps<{
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
  complete: [AutoCompleteCompleteEvent]
  findFocus: []
  findSelect: [AutoCompleteOptionSelectEvent]
  createTask: []
}>()
</script>

<template>
  <UiCard class="qa-card ui--single-card">
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
    </div>

    <template v-if="activeTab === 'create'" #footer>
      <div class="qa-footer">
        <UiButton
          label="Create Task"
          size="small"
          color="blue"
          fill="filled"
          class="qa-create-btn"
          :disabled="!props.newTitle.trim() || props.creating"
          @click="emit('createTask')"
        />
      </div>
    </template>
  </UiCard>
</template>

<style scoped>
/* UiCard token overrides — zero internal padding/gap, tighter radius.
   Each section controls its own spacing so the tab underline runs
   edge-to-edge while the body stays tight. The #footer gets its own
   default padding from UiCard (divider + gray background). */
.qa-card {
  --card-padding: 0;
  --card-content__gap: 0;
  --card__border-radius: 6px;
  min-width: 280px;
}
.qa-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  padding: 0 8px;
}
.qa-tab {
  background: transparent;
  border: none;
  padding: 6px 8px;
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
.qa-date { font-size: 12px; margin-right: 8px; }
.qa-body { display: flex; flex-direction: column; gap: 6px; padding: 8px; }
.qa-input { width: 100%; }
.qa-input :deep(.p-inputtext) { width: 100%; }
.qa-input :deep(.p-autocomplete-input) { width: 100%; }
/* UiCard's footer only sets vertical padding — we add the horizontal
   8px ourselves so the button lines up with the input above (which is
   inside `.qa-body` with the same 8px padding). */
.qa-footer { padding: 0 8px; }
.qa-create-btn :deep(.ui-button-wrapper) {
  width: 100%;
  --button--justify-content: center;
}
</style>
