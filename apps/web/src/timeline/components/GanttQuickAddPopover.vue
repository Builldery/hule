<script setup lang="ts">
import { computed } from 'vue'
import AutoComplete, { type AutoCompleteCompleteEvent, type AutoCompleteOptionSelectEvent } from 'primevue/autocomplete'
import {
  UiButton,
  UiCard,
  UiInput,
  UiTabSet,
  UiTab,
} from '@buildery/ui-kit/components'
import type { Task } from '@hule/types'

const props = defineProps<{
  popoverDay: Date | null
  activeTab: 'find' | 'create'
  findQuery: string
  findSuggestions: Task[]
  newTitle: string
  creating: boolean
}>()

const dayLabel = computed(() =>
  props.popoverDay
    ? props.popoverDay.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : '',
)
const createPlaceholder = computed(() => dayLabel.value ? `Task name · ${dayLabel.value}` : 'Task name')
const findPlaceholder = computed(() => dayLabel.value ? `Search undated tasks · ${dayLabel.value}` : 'Search undated tasks')

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
    <UiTabSet
      :active-tab="activeTab"
      class="qa-tabset"
      @update:active-tab="(v: string) => emit('update:activeTab', v as 'find' | 'create')"
    >
      <UiTab value="find" label="Find Task">
        <div class="qa-body">
          <AutoComplete
            :model-value="findQuery"
            :suggestions="findSuggestions"
            option-label="title"
            :placeholder="findPlaceholder"
           
            class="qa-input"
            :min-length="0"
            force-selection
            @update:model-value="(v: unknown) => emit('update:findQuery', v as string)"
            @complete="(ev: AutoCompleteCompleteEvent) => emit('complete', ev)"
            @option-select="(ev: AutoCompleteOptionSelectEvent) => emit('findSelect', ev)"
            @focus="emit('findFocus')"
          />
        </div>
      </UiTab>
      <UiTab value="create" label="Create Task">
        <div class="qa-body">
          <UiInput
            :value="newTitle"
            :placeholder="createPlaceholder"
           
            autofocus
            class="qa-input"
            @update:value="(v: unknown) => emit('update:newTitle', String(v ?? ''))"
            @keydown.enter.stop="emit('createTask')"
          />
        </div>
      </UiTab>
    </UiTabSet>

    <template v-if="activeTab === 'create'" #footer>
      <div class="qa-footer">
        <UiButton
          label="Create Task"
         
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
/* UiCard tokens — zero padding/gap, tighter radius. Sections manage
   their own spacing. */
.qa-card {
  --card-padding: 0;
  --card-content__gap: 0;
  --card__border-radius: 6px;
  min-width: 280px;
}
/* UiTabSet wraps tabs + content in a flex-column. We only need to
   ensure the tab bar has a small left padding and the body has a tight
   padding (managed by `.qa-body`). */
.qa-tabset :deep(.ui--flex-row) {
  padding: 0 8px;
  margin-top: 2px;
}
.qa-body { padding: 8px; }
.qa-input { width: 100%; }
.qa-input :deep(.p-inputtext) { width: 100%; }
.qa-input :deep(.p-autocomplete-input) { width: 100%; }
/* UiCard's footer sets only vertical padding — add 8px horizontal so the
   button lines up with the input above (inside `.qa-body`). */
.qa-footer { padding: 0 8px; }
.qa-create-btn :deep(.ui-button-wrapper) {
  width: 100%;
  --button--justify-content: center;
}
</style>
