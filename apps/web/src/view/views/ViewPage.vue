<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ViewKind } from '@hule/types'
import {
  UiButton,
  UiButtonGroup,
  UiCombobox,
  UiIconButton,
  UiListboxOption,
  UiRadioButton,
  UiRadioGroup,
  UiRawInput,
} from '@buildery/ui-kit/components'
import { useViewsStore } from '@/view/store/useViewsStore'
import { useListsStore } from '@/list/store/useListsStore'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import { useWorkspacesStore } from '@/workspace/store/useWorkspacesStore'
import { useToast } from '@/app/compose/useToast'
import ViewListMode from '@/view/components/ViewListMode.vue'
import ViewKanbanBoard from '@/view/components/ViewKanbanBoard.vue'
import ViewGanttView from '@/view/components/ViewGanttView.vue'

const props = defineProps<{ viewId: string }>()

const viewsStore = useViewsStore()
const listsStore = useListsStore()
const spacesStore = useSpacesStore()
const workspacesStore = useWorkspacesStore()
const toast = useToast()

const view = computed(() => viewsStore.byId[props.viewId] ?? null)

const localKind = ref<ViewKind>('list')
const localListIds = ref<string[]>([])
const saving = ref(false)

const editingLabel = ref(false)
const labelDraft = ref('')

const modes: { label: string; value: ViewKind }[] = [
  { label: 'List', value: 'list' },
  { label: 'Kanban', value: 'kanban' },
  { label: 'Timeline', value: 'timeline' },
]

function syncFromView(): void {
  if (!view.value) return
  localKind.value = view.value.kind
  localListIds.value = view.value.listRefs.map(r => r.listId)
  if (!editingLabel.value) labelDraft.value = view.value.label
}

watch(() => view.value, syncFromView, { immediate: true })
watch(() => props.viewId, () => {
  editingLabel.value = false
  syncFromView()
})

const isDirty = computed(() => {
  const v = view.value
  if (!v) return false
  if (localKind.value !== v.kind) return true
  const saved = v.listRefs.map(r => r.listId).sort().join(',')
  const local = [...localListIds.value].sort().join(',')
  return saved !== local
})

const wsId = computed(() => workspacesStore.currentWorkspaceId ?? '')

const allListsFlat = computed(() =>
  spacesStore.items.flatMap(s => listsStore.getFor(s.id))
)

function getListName(id: string): string {
  return listsStore.byId[id]?.name ?? id
}

function onListsChange(v: string | ReadonlyArray<string> | undefined): void {
  localListIds.value = Array.isArray(v) ? Array.from(v) : []
}

function onKindChange(v: unknown): void {
  const s = String(v ?? '')
  if (s === 'kanban' || s === 'timeline' || s === 'list') {
    localKind.value = s
  }
}

async function saveLabel(): Promise<void> {
  const trimmed = labelDraft.value.trim()
  if (!trimmed || trimmed === view.value?.label) {
    labelDraft.value = view.value?.label ?? ''
    editingLabel.value = false
    return
  }
  try {
    await viewsStore.update(props.viewId, { label: trimmed })
    editingLabel.value = false
  } catch (e) {
    toast.error(`Ошибка переименования: ${String(e)}`)
  }
}

async function save(): Promise<void> {
  const v = view.value
  if (!v || saving.value) return
  saving.value = true
  try {
    await viewsStore.update(v.id, {
      kind: localKind.value,
      listRefs: localListIds.value.map(listId => ({ listId, workspaceId: wsId.value })),
    })
  } catch (e) {
    toast.error(`Ошибка сохранения: ${String(e)}`)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (!viewsStore.loaded) await viewsStore.loadAll()
  await Promise.all(spacesStore.items.map(s => listsStore.loadForSpace(s.id)))
  syncFromView()
})
</script>

<template>
  <div v-if="view" class="view-page">
    <div class="view-header">
      <div class="view-title-area">
        <div v-if="editingLabel" class="view-title-input">
          <UiRawInput
            :value="labelDraft"
            autofocus
            @update:value="(v: unknown) => labelDraft = String(v ?? '')"
            @keydown.enter.stop="saveLabel"
            @keydown.escape="() => { labelDraft = view!.label; editingLabel = false }"
            @blur="saveLabel"
          />
        </div>
        <template v-else>
          <span class="view-title" @dblclick="editingLabel = true">{{ view.label }}</span>
          <UiIconButton
            size="small"
            fill="outlined-tonal"
            color="gray"
            title="Переименовать"
            icon-name="EditPencil"
            @click="editingLabel = true"
          />
        </template>
      </div>

      <div class="view-header-sep" />

      <UiCombobox
        multiple
        :value="localListIds"
        :get-display-value="getListName"
        placeholder="Выбрать списки"
        class="view-header__combobox"
        @update:value="onListsChange"
      >
        <UiListboxOption
          v-for="list in allListsFlat"
          :key="list.id"
          :value="list.id"
        >
          {{ list.name }}
        </UiListboxOption>
      </UiCombobox>

      <UiButtonGroup>
        <UiRadioGroup :value="localKind" @update:value="onKindChange">
          <UiRadioButton
            v-for="m in modes"
            :key="m.value"
            :value="m.value"
            :label="m.label"
          />
        </UiRadioGroup>
      </UiButtonGroup>

      <UiButton
        v-if="isDirty"
        label="Сохранить"
        fill="filled"
        color="blue"
        :loading="saving"
        @click="save"
      />
    </div>

    <div class="view-body">
      <div v-if="localListIds.length === 0" class="view-empty muted">
        Выберите списки для отображения
      </div>

      <ViewListMode v-else-if="localKind === 'list'" :list-ids="localListIds" />
      <ViewKanbanBoard v-else-if="localKind === 'kanban'" :list-ids="localListIds" />
      <ViewGanttView v-else-if="localKind === 'timeline'" :list-ids="localListIds" />
    </div>
  </div>

  <div v-else-if="viewsStore.loading" class="view-loading muted">Загрузка…</div>
  <div v-else class="view-loading muted">View не найден.</div>
</template>

<style scoped>
.view-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.view-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.view-title-area {
  display: flex;
  align-items: center;
  gap: 4px;
}
.view-title {
  font-weight: 600;
  font-size: 14px;
  cursor: default;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}
.view-title-input {
  display: flex;
}
.view-title-input :deep(input) {
  padding: 4px 6px;
  border: none;
  outline: none;
  background: var(--hover);
  border-radius: 4px;
  font: inherit;
  font-weight: 600;
  font-size: 14px;
  color: inherit;
  width: 160px;
}
.view-header-sep {
  width: 1px;
  height: 20px;
  background: var(--border);
  flex-shrink: 0;
}
.view-header__combobox {
  width: 220px;
}
.view-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.view-empty,
.view-loading {
  padding: 32px 24px;
  font-size: 14px;
}
</style>
