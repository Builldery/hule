<script setup lang="ts">
import SelectButton from 'primevue/selectbutton'
import type { ViewMode } from '../classes/GanttWindowCalculator'

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
    <SelectButton
      :model-value="modelValue"
      :options="viewModes"
      size="small"
      :allow-empty="false"
      @update:model-value="v => emit('update:modelValue', v)"
    />
    <button class="tb-btn" @click="emit('today')">Today</button>
    <button class="tb-btn" :disabled="fitDisabled" @click="emit('fit')">Fit all</button>
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
.tb-btn {
  border: 1px solid var(--border);
  background: var(--bg);
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s;
}
.tb-btn:hover { background: var(--hover); border-color: var(--text-muted); }
.tb-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
