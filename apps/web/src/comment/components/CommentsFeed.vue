<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { UiButton, UiIconButton, UiInfo } from '@buildery/ui-kit/components'
import Textarea from 'primevue/textarea'
import { useCommentsStore } from '@/comment/store/useCommentsStore'
import { useWorkspacesStore } from '@/workspace/store/useWorkspacesStore'
import { TOKEN_STORAGE_KEY } from '@/app/api/httpClient'
import CommentComposer from './CommentComposer.vue'

const props = defineProps<{ taskId: string }>()

const commentsStore = useCommentsStore()
const workspacesStore = useWorkspacesStore()

const items = computed(() => commentsStore.getForTask(props.taskId))

const objectUrls = ref<Record<string, string>>({})
const editingId = ref<string | null>(null)
const draft = ref('')
const saving = ref(false)

async function fetchAttachmentUrl(fileId: string): Promise<void> {
  if (objectUrls.value[fileId]) return
  const wsId = workspacesStore.currentWorkspaceId
  if (!wsId) return
  const token = (() => { try { return localStorage.getItem(TOKEN_STORAGE_KEY) } catch { return null } })()
  try {
    const res = await fetch(`/api/workspaces/${wsId}/files/${fileId}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) return
    const blob = await res.blob()
    objectUrls.value = { ...objectUrls.value, [fileId]: URL.createObjectURL(blob) }
  } catch {
    /* ignore */
  }
}

function syncAttachments(): void {
  const seen = new Set<string>()
  for (const c of items.value) {
    for (const a of c.attachments) {
      seen.add(a.fileId)
      if (!objectUrls.value[a.fileId]) void fetchAttachmentUrl(a.fileId)
    }
  }
  for (const fileId of Object.keys(objectUrls.value)) {
    if (!seen.has(fileId)) {
      URL.revokeObjectURL(objectUrls.value[fileId])
      delete objectUrls.value[fileId]
    }
  }
}

onMounted(() => {
  void commentsStore.loadForTask(props.taskId)
})

watch(() => props.taskId, id => {
  void commentsStore.loadForTask(id)
})

watch(items, () => syncAttachments(), { deep: true, immediate: true })

onBeforeUnmount(() => {
  for (const url of Object.values(objectUrls.value)) URL.revokeObjectURL(url)
  objectUrls.value = {}
})

function formatDate(s: string): string {
  const d = new Date(s)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function startEdit(id: string, body: string | undefined): void {
  editingId.value = id
  draft.value = body ?? ''
}

function cancelEdit(): void {
  editingId.value = null
  draft.value = ''
}

async function saveEdit(id: string): Promise<void> {
  if (saving.value) return
  const text = draft.value.trim()
  const original = items.value.find(c => c.id === id)
  if (!original) { cancelEdit(); return }
  if (text === (original.body ?? '')) { cancelEdit(); return }
  if (!text && original.attachments.length === 0) return
  saving.value = true
  try {
    await commentsStore.update(id, props.taskId, { body: text })
    cancelEdit()
  } finally {
    saving.value = false
  }
}

async function remove(id: string): Promise<void> {
  await commentsStore.remove(id, props.taskId)
}
</script>

<template>
  <div class="feed">
    <UiInfo v-if="items.length === 0">No comments yet.</UiInfo>
    <div v-for="c in items" :key="c.id" class="comment">
      <header class="head">
        <span class="kind muted">{{ c.kind === 'activity' ? '• activity' : 'Comment' }}</span>
        <span class="muted date">{{ formatDate(c.createdAt) }}</span>
        <div class="actions">
          <UiIconButton
            v-if="editingId !== c.id"
            size="small"
            fill="outlined-tonal"
            color="gray"
            class="act"
            title="Edit comment"
            icon-name="EditPencil"
            @click="startEdit(c.id, c.body)"
          />
          <UiIconButton
            size="small"
            fill="outlined-tonal"
            color="red"
            class="act"
            title="Delete comment"
            icon-name="Trash"
            @click="remove(c.id)"
          />
        </div>
      </header>
      <div v-if="editingId === c.id" class="edit">
        <Textarea
          v-model="draft"
          auto-resize
          rows="2"
          class="edit-textarea"
          @keydown.enter.exact.ctrl.prevent="saveEdit(c.id)"
          @keydown.enter.exact.meta.prevent="saveEdit(c.id)"
          @keydown.escape.prevent="cancelEdit"
        />
        <div class="edit-actions">
          <span class="muted hint">Ctrl/Cmd + Enter</span>
          <UiButton
            label="Cancel"
            color="gray"
            fill="text"
            @click="cancelEdit"
          />
          <UiButton
            label="Save"
            color="blue"
            fill="filled"
            :disabled="saving || (!draft.trim() && c.attachments.length === 0)"
            @click="saveEdit(c.id)"
          />
        </div>
      </div>
      <div v-else-if="c.body" class="body">{{ c.body }}</div>
      <div v-if="c.attachments.length > 0" class="attachments">
        <a
          v-for="a in c.attachments"
          :key="a.fileId"
          :href="objectUrls[a.fileId] ?? '#'"
          :download="a.filename"
          target="_blank"
          rel="noopener"
          class="attachment"
        >
          <img v-if="a.mime.startsWith('image/') && objectUrls[a.fileId]" :src="objectUrls[a.fileId]" :alt="a.filename">
          <span v-else class="file-name">{{ a.filename }}</span>
        </a>
      </div>
    </div>
    <CommentComposer :task-id="props.taskId" />
  </div>
</template>

<style scoped>
.feed { display: flex; flex-direction: column; gap: 12px; }
.comment {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  background: var(--bg);
}
.head {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  margin-bottom: 6px;
}
.actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.act { opacity: 0; transition: opacity 0.1s; }
.comment:hover .act { opacity: 1; }
.date { margin-left: auto; }
.kind { text-transform: uppercase; letter-spacing: 0.3px; font-weight: 500; }
.body { white-space: pre-wrap; font-size: 14px; }
.edit { display: flex; flex-direction: column; gap: 6px; }
.edit-textarea { width: 100%; }
.edit-textarea :deep(textarea) {
  width: 100%;
  resize: vertical;
  min-height: 56px;
  border: 1px solid var(--border);
  box-shadow: none;
  padding: 6px 8px;
  font: inherit;
  background: var(--bg);
  color: inherit;
}
.edit-textarea :deep(textarea:focus) { border-color: var(--accent-primary); outline: none; }
.edit-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
.hint { font-size: 11px; }
.attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.attachment {
  display: block;
  max-width: 280px;
  max-height: 280px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border);
  text-decoration: none;
  color: inherit;
  background: var(--bg-muted);
}
.attachment img { display: block; max-width: 100%; max-height: 280px; }
.file-name { display: block; padding: 10px; font-size: 13px; }
</style>
