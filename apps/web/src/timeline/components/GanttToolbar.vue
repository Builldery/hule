<script setup lang="ts">
import {
  UiButton,
  UiButtonGroup,
  UiRadioGroup,
  UiRadioButton,
} from '@buildery/ui-kit/components'
import { VIEW_MODE_LABEL, type ViewMode } from '../classes/GanttWindowCalculator'

defineProps<{
  modelValue: ViewMode
  viewModes: ViewMode[]
  taskCount: number
  fitDisabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [mode: ViewMode]
  today: []
  fit: []
}>()
</script>

<template>
  <div class="toolbar">
    <UiButtonGroup>
      <UiRadioGroup
        :value="modelValue"
        @update:value="(v: unknown) => emit('update:modelValue', v as ViewMode)"
      >
        <UiRadioButton
          v-for="m in viewModes"
          :key="m"
          :value="m"
          :label="VIEW_MODE_LABEL[m]"
          size="small"
        />
      </UiRadioGroup>
    </UiButtonGroup>
    <UiButton size="small" fill="outlined-tonal" color="gray" label="Today" @click="emit('today')" />
    <UiButton
      size="small"
      fill="outlined-tonal"
      color="gray"
      label="Fit all"
      :disabled="fitDisabled"
      @click="emit('fit')"
    />
    <span class="tb-spacer" />
    <span v-if="taskCount > 0" class="muted small">
      {{ taskCount }} {{ taskCount === 1 ? 'task' : 'tasks' }}
    </span>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--bg);
}
.small { font-size: 12px; }
.tb-spacer { flex: 1; }
</style>
