<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import type { View, ViewKind, ViewListRef } from '@hule/types'
import {
  UiButton,
  UiInput,
  UiRadioGroup,
  UiRadioButton,
  UiCheckbox,
} from '@buildery/ui-kit/components'
import { useViewsStore } from '@/view/store/useViewsStore'
import { useListsStore } from '@/list/store/useListsStore'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import { useWorkspacesStore } from '@/workspace/store/useWorkspacesStore'
import { useToast } from '@/app/compose/useToast'
import { useViewModal } from '@/app/compose/useViewModal'

const props = defineProps<{
  mode: 'create' | 'edit'
  view?: View
}>()

const viewsStore = useViewsStore()
const listsStore = useListsStore()
const spacesStore = useSpacesStore()
const workspacesStore = useWorkspacesStore()
const toast = useToast()
const viewModal = useViewModal()

const label = ref('')
const kind = ref<ViewKind>('list')
const selectedListIds = ref<string[]>([])
const submitting = ref(false)

const kinds: { label: string; value: ViewKind }[] = [
  { label: 'List', value: 'list' },
  { label: 'Kanban', value: 'kanban' },
  { label: 'Timeline', value: 'timeline' },
]

function resetForm(): void {
  if (props.mode === 'edit' && props.view) {
    label.value = props.view.label
    kind.value = props.view.kind
    selectedListIds.value = props.view.listRefs.map(r => r.listId)
  } else {
    label.value = ''
    kind.value = 'list'
    selectedListIds.value = []
  }
}

watch(() => [props.mode, props.view] as const, resetForm, { immediate: true })

onMounted(async () => {
  await Promise.all(spacesStore.items.map(s => listsStore.loadForSpace(s.id)))
})

const spacesWithLists = computed(() =>
  spacesStore.items
    .map(s => ({ space: s, lists: listsStore.getFor(s.id) }))
    .filter(g => g.lists.length > 0)
)

const wsId = computed(() => workspacesStore.currentWorkspaceId ?? '')

function toggleList(listId: string): void {
  if (selectedListIds.value.includes(listId)) {
    selectedListIds.value = selectedListIds.value.filter(id => id !== listId)
  } else {
    selectedListIds.value = [...selectedListIds.value, listId]
  }
}

async function submit(): Promise<void> {
  if (submitting.value) return
  const trimmed = label.value.trim()
  if (!trimmed) return
  submitting.value = true
  try {
    const listRefs: ViewListRef[] = selectedListIds.value.map(listId => ({
      listId,
      workspaceId: wsId.value,
    }))
    if (props.mode === 'create') {
      await viewsStore.create({ label: trimmed, kind: kind.value, listRefs })
    } else if (props.view) {
      await viewsStore.update(props.view.id, { label: trimmed, kind: kind.value, listRefs })
    }
    viewModal.close()
  } catch (e) {
    toast.error(`Failed to save view: ${String(e)}`)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="view-form">
    <div class="view-form__title">
      {{ mode === 'create' ? 'Создать view' : 'Редактировать view' }}
    </div>

    <div class="view-form__field">
      <div class="view-form__label">Название</div>
      <UiInput
        :value="label"
        placeholder="Название view"
        autofocus
        @update:value="(v: unknown) => label = String(v ?? '')"
        @keydown.enter.stop="submit"
      />
    </div>

    <div class="view-form__field">
      <div class="view-form__label">Отображение</div>
      <UiRadioGroup :value="kind" @update:value="(v: unknown) => kind = v as ViewKind">
        <div class="view-form__radio-row">
          <UiRadioButton
            v-for="k in kinds"
            :key="k.value"
            :value="k.value"
            :label="k.label"
          />
        </div>
      </UiRadioGroup>
    </div>

    <div class="view-form__field">
      <div class="view-form__label">Списки</div>
      <div class="view-form__lists">
        <div v-for="group in spacesWithLists" :key="group.space.id" class="view-form__space-group">
          <div class="view-form__space-name">{{ group.space.name }}</div>
          <div
            v-for="list in group.lists"
            :key="list.id"
            class="view-form__list-item"
          >
            <UiCheckbox
              :value="list.id"
              :checked="selectedListIds.includes(list.id)"
              :label="list.name"
              @update:value="toggleList(list.id)"
            />
          </div>
        </div>
        <div v-if="spacesWithLists.length === 0" class="muted view-form__no-lists">
          Нет доступных списков
        </div>
      </div>
    </div>

    <div class="view-form__actions">
      <UiButton label="Отмена" fill="tonal" color="gray" @click="viewModal.close()" />
      <UiButton
        :label="mode === 'create' ? 'Создать' : 'Сохранить'"
        fill="filled"
        color="blue"
        :loading="submitting"
        @click="submit"
      />
    </div>
  </div>
</template>

<style scoped>
.view-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  min-width: 420px;
}
.view-form__title {
  font-size: 16px;
  font-weight: 600;
}
.view-form__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.view-form__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted, #888);
}
.view-form__radio-row {
  display: flex;
  gap: 8px;
}
.view-form__lists {
  border: 1px solid var(--border);
  border-radius: 6px;
  max-height: 260px;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.view-form__space-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.view-form__space-name {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted, #888);
  padding: 4px 4px 2px;
}
.view-form__list-item {
  padding: 2px 4px;
}
.view-form__no-lists {
  font-size: 13px;
  padding: 8px 4px;
}
.view-form__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
