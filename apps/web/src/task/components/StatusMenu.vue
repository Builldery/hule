<script lang="ts">
export default { name: 'StatusMenu' }
</script>

<script setup lang="ts">
import {
  UiCard,
  UiListbox,
  UiListboxOption,
  UiPopover,
  UiPopoverPanel,
  UiPopoverTrigger,
} from '@buildery/ui-kit/components'
import { STATUS_OPTIONS, statusMeta } from '@/task/constants/tasks'

const props = defineProps<{ value: string }>()
const emit = defineEmits<{ (e: 'update:value', v: string): void }>()

function onSelect(v: string | undefined): void {
  if (!v || v === props.value) return
  emit('update:value', v)
}
</script>

<template>
  <UiPopover :close-on-content-click="true">
    <UiPopoverTrigger @click.stop>
      <slot :meta="statusMeta(value)" />
    </UiPopoverTrigger>
    <UiPopoverPanel>
      <UiCard class="status-menu ui--single-card">
        <UiListbox :model-value="value" @select="onSelect">
          <UiListboxOption
            v-for="o in STATUS_OPTIONS"
            :key="o.value"
            :value="o.value"
            :label="o.label"
          >
            <span class="status-menu__row">
              <span class="status-menu__dot" :style="{ background: o.color }" />
              <span>{{ o.label }}</span>
            </span>
          </UiListboxOption>
        </UiListbox>
      </UiCard>
    </UiPopoverPanel>
  </UiPopover>
</template>

<style scoped>
.status-menu {
  --card-padding: 4px;
  --card-content__gap: 0;
  --card__border-radius: var(--ui--border-radius__medium);
  min-width: 160px;
}
.status-menu__row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-menu__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
