<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { UiButton } from '@buildery/ui-kit/components'
import { useCommentsStore } from '@/comment/store/useCommentsStore'
import { getR2DownloadUrl } from '@/file/api/filesApi'
import CommentComposer from './CommentComposer.vue'

const props = defineProps<{ taskId: string }>()

const commentsStore = useCommentsStore()

const items = computed(() => commentsStore.getForTask(props.taskId))

const urlByKey = ref<Record<string, string>>({})
const inflight = new Set<string>()

async function ensureUrl(storageKey: string): Promise<void> {
  if (!storageKey || urlByKey.value[storageKey] || inflight.has(storageKey)) return
  inflight.add(storageKey)
  try {
    const url = await getR2DownloadUrl(storageKey)
    urlByKey.value = { ...urlByKey.value, [storageKey]: url }
  } finally {
    inflight.delete(storageKey)
  }
}

function resolveUrlsForCurrentItems(): void {
  for (const c of items.value) {
    for (const a of c.attachments) {
      void ensureUrl(a.storageKey)
    }
  }
}

onMounted(() => { void commentsStore.loadForTask(props.taskId) })
watch(() => props.taskId, id => { void commentsStore.loadForTask(id) })
watch(items, resolveUrlsForCurrentItems, { immediate: true, deep: true })

function formatDate(s: string): string {
  const d = new Date(s)
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

async function remove(id: string): Promise<void> {
  await commentsStore.remove(id, props.taskId)
}

async function openAttachment(storageKey: string, ev: MouseEvent): Promise<void> {
  const cached = urlByKey.value[storageKey]
  if (cached) return
  ev.preventDefault()
  await ensureUrl(storageKey)
  const url = urlByKey.value[storageKey]
  if (url) window.open(url, '_blank', 'noopener')
}
</script>

<template>
  <div class="feed">
    <div v-if="items.length === 0" class="muted empty">No comments yet.</div>
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
            :key="a.storageKey"
            :href="urlByKey[a.storageKey] ?? '#'"
            target="_blank"
            rel="noopener"
            class="attachment"
            @click="openAttachment(a.storageKey, $event)"
        >
          <img
              v-if="a.mime.startsWith('image/') && urlByKey[a.storageKey]"
              :src="urlByKey[a.storageKey]"
              :alt="a.filename"
          >
          <span v-else class="file-name">{{ a.filename }}</span>
        </a>
      </div>
    </div>
    <CommentComposer :task-id="props.taskId" />
  </div>
</template>

<style scoped>
.feed { display: flex; flex-direction: column; gap: 12px; }
.empty { padding: 8px 0; }
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
