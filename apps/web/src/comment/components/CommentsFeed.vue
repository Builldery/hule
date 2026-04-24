<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { UiButton, UiInfo } from '@buildery/ui-kit/components'
import { useCommentsStore } from '@/comment/store/useCommentsStore'
import { useWorkspacesStore } from '@/workspace/store/useWorkspacesStore'
import { TOKEN_STORAGE_KEY } from '@/app/api/httpClient'
import CommentComposer from './CommentComposer.vue'

const props = defineProps<{ taskId: string }>()

const commentsStore = useCommentsStore()
const workspacesStore = useWorkspacesStore()

const items = computed(() => commentsStore.getForTask(props.taskId))

const objectUrls = ref<Record<string, string>>({})

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
        <UiButton
          fill="text"
          color="gray"
          size="small"
          class="del"
          title="Delete comment"
          @click="remove(c.id)"
        >
          <i class="pi pi-trash" aria-label="Delete comment" />
        </UiButton>
      </header>
      <div v-if="c.body" class="body">{{ c.body }}</div>
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
.comment:hover .del { opacity: 1; }
.del { margin-left: auto; opacity: 0; transition: opacity 0.1s; }
.date { margin-left: auto; }
.kind { text-transform: uppercase; letter-spacing: 0.3px; font-weight: 500; }
.body { white-space: pre-wrap; font-size: 14px; }
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
