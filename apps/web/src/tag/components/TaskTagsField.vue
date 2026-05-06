<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  UiCombobox,
  UiIconButton,
  UiInput,
  UiListboxOption,
  UiPopover,
  UiPopoverPanel,
  UiPopoverTrigger,
  UiRawInput,
} from '@buildery/ui-kit/components'
import type { Tag, TagColor } from '@hule/types'
import { useTagsStore } from '@/tag/store/useTagsStore'
import { useTasksStore } from '@/task/store/useTasksStore'
import { useConfirm } from '@/app/compose/useConfirm'
import { HttpError } from '@/app/api/httpClient'

const props = defineProps<{ value: string[] }>()
const emits = defineEmits<{ (e: 'update:value', v: string[]): void }>()

const tagsStore = useTagsStore()
const tasksStore = useTasksStore()
const confirm = useConfirm()

const TAG_COLORS: TagColor[] = ['blue', 'green', 'orange', 'red', 'gray', 'purple']

const search = ref('')

const getName = (id: string): string => tagsStore.byId[id]?.name ?? id

const filteredTags = computed<Tag[]>(() => {
  const q = search.value.trim().toLowerCase()
  const all = tagsStore.sorted
  if (!q) return all
  return all.filter(t => t.name.toLowerCase().includes(q))
})

const exactMatch = computed<boolean>(() => {
  const q = search.value.trim()
  if (!q) return false
  return tagsStore.items.some(t => t.name === q)
})

const showCreate = computed<boolean>(() => {
  return search.value.trim().length > 0 && !exactMatch.value
})

const createError = ref<string | null>(null)
const creating = ref(false)

async function createAndPick(): Promise<void> {
  const name = search.value.trim()
  if (!name || creating.value) return
  creating.value = true
  createError.value = null
  try {
    const created = await tagsStore.create({ name, color: 'gray' })
    if (!props.value.includes(created.id)) {
      emits('update:value', [...props.value, created.id])
    }
    search.value = ''
  } catch (e) {
    if (e instanceof HttpError && e.status === 409) {
      createError.value = 'Тэг с таким именем уже существует'
    } else {
      createError.value = 'Не удалось создать тэг'
    }
  } finally {
    creating.value = false
  }
}

function onComboboxValue(v: string | ReadonlyArray<string> | undefined): void {
  const arr = Array.isArray(v) ? Array.from(v) : []
  emits('update:value', arr)
}

function onSearchInput(v: unknown): void {
  search.value = String(v ?? '')
  createError.value = null
}

function onComboboxClose(): void {
  search.value = ''
  createError.value = null
}

const editingTagId = ref<string | null>(null)
const renameDraft = ref('')
const renameError = ref<string | null>(null)

function startRename(tag: Tag): void {
  editingTagId.value = tag.id
  renameDraft.value = tag.name
  renameError.value = null
}

function cancelRename(): void {
  editingTagId.value = null
  renameDraft.value = ''
  renameError.value = null
}

async function saveRename(tag: Tag): Promise<void> {
  if (editingTagId.value !== tag.id) return
  const name = renameDraft.value.trim()
  if (!name || name === tag.name) {
    cancelRename()
    return
  }
  try {
    await tagsStore.update(tag.id, { name })
    cancelRename()
  } catch (e) {
    if (e instanceof HttpError && e.status === 409) {
      renameError.value = 'Имя занято'
    } else {
      renameError.value = 'Ошибка'
    }
  }
}

async function setColor(tag: Tag, color: TagColor): Promise<void> {
  if (tag.color === color) return
  try {
    await tagsStore.update(tag.id, { color })
  } catch {
    /* swallow — non-critical */
  }
}

async function confirmDelete(tag: Tag): Promise<void> {
  const usedCount = Object.values(tasksStore.byId).filter(t => t.tagIds.includes(tag.id)).length
  const description = usedCount > 0
    ? `Тэг будет удалён со всех задач (${usedCount}).`
    : 'Тэг ещё не используется.'
  const ok = await confirm.delete({
    title: `Удалить тэг "${tag.name}"?`,
    description,
  })
  if (!ok) return
  await tagsStore.remove(tag.id)
}
</script>

<template>
  <UiCombobox
    multiple
    :value="props.value"
    :get-display-value="getName"
    placeholder="Tags"
    no-options-message="Нет тэгов. Введите имя и нажмите «+ Создать»."
    @update:value="onComboboxValue"
    @close="onComboboxClose"
  >
    <div class="tt-search" @click.stop @mousedown.stop>
      <UiInput
        :value="search"
        placeholder="Поиск или создание тэга"
        autofocus
        @update:value="onSearchInput"
        @keydown.enter.stop="createAndPick"
      />
    </div>

    <UiListboxOption
      v-for="tag in filteredTags"
      :key="tag.id"
      :value="tag.id"
    >
      <div v-if="editingTagId === tag.id" class="tt-row tt-row--editing" @click.stop>
        <span
          class="tt-dot"
          :style="{ background: `var(--ui--color__${tag.color})` }"
        />
        <UiRawInput
          :value="renameDraft"
          autofocus
          class="tt-rename-input"
          @click.stop
          @update:value="(v: unknown) => renameDraft = String(v ?? '')"
          @keydown.enter.stop="() => saveRename(tag)"
          @keydown.escape.stop="cancelRename"
          @blur="() => saveRename(tag)"
        />
        <span v-if="renameError" class="tt-error">{{ renameError }}</span>
      </div>

      <div v-else class="tt-row">
        <span
          class="tt-dot"
          :style="{ background: `var(--ui--color__${tag.color})` }"
        />
        <span class="tt-name">{{ tag.name }}</span>

        <div class="tt-actions" @click.stop>
          <UiPopover :close-on-content-click="true">
            <UiPopoverTrigger>
              <UiIconButton size="small" fill="text" color="gray" title="Цвет" icon-name="Palette" />
            </UiPopoverTrigger>
            <UiPopoverPanel>
              <div class="tt-swatches">
                <button
                  v-for="c in TAG_COLORS"
                  :key="c"
                  class="tt-swatch"
                  :class="{ 'tt-swatch--active': c === tag.color }"
                  :style="{ background: `var(--ui--color__${c})` }"
                  :title="c"
                  @click.stop="() => setColor(tag, c)"
                />
              </div>
            </UiPopoverPanel>
          </UiPopover>

          <UiIconButton
            size="small"
            fill="text"
            color="gray"
            title="Переименовать"
            icon-name="EditPencil"
            @click.stop="() => startRename(tag)"
          />

          <UiIconButton
            size="small"
            fill="text"
            color="gray"
            title="Удалить"
            icon-name="Trash"
            @click.stop="() => confirmDelete(tag)"
          />
        </div>
      </div>
    </UiListboxOption>

    <div v-if="showCreate" class="tt-create" @mousedown.prevent @click.stop="createAndPick">
      <i class="pi pi-plus" />
      <span>Создать «{{ search.trim() }}»</span>
      <span v-if="creating" class="tt-create__hint">…</span>
    </div>
    <div v-if="createError" class="tt-create-error">{{ createError }}</div>
  </UiCombobox>
</template>

<style scoped>
.tt-search {
  padding: 8px;
  border-bottom: 1px solid var(--ui--color__gray--300, #eee);
}
.tt-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.tt-row--editing { padding: 2px 0; }
.tt-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.tt-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tt-actions {
  display: flex;
  align-items: center;
  gap: 0;
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.1s;
}
.ui-listbox-option:hover .tt-actions,
.ui-listbox-option:focus-within .tt-actions {
  opacity: 1;
}
.tt-rename-input { flex: 1; }
.tt-rename-input :deep(input) {
  width: 100%;
  padding: 2px 4px;
  border: 1px solid var(--border, var(--ui--color__gray--600));
  border-radius: 3px;
  outline: none;
  font: inherit;
  background: var(--bg, white);
}
.tt-error {
  font-size: 11px;
  color: var(--ui--color__red, crimson);
  margin-left: 6px;
}

.tt-swatches {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  padding: 6px;
}
.tt-swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid var(--ui--color__gray--600, rgba(0,0,0,0.15));
  cursor: pointer;
  padding: 0;
}
.tt-swatch--active { outline: 2px solid var(--ui--color__gray--1200, #000); outline-offset: 1px; }

.tt-create {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  border-top: 1px solid var(--ui--color__gray--300, #eee);
  font-size: 13px;
  color: var(--ui--color__gray--1200, #333);
}
.tt-create:hover { background: var(--ui--color__gray--200, #f5f5f5); }
.tt-create__hint { color: var(--text-muted); font-size: 12px; margin-left: auto; }
.tt-create-error {
  padding: 4px 8px;
  font-size: 12px;
  color: var(--ui--color__red, crimson);
}
</style>
