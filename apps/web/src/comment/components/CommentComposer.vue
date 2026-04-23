<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import { useDropZone } from '@vueuse/core'
import { useCommentsStore } from '@/comment/store/useCommentsStore'

const props = defineProps<{ taskId: string }>()

const commentsStore = useCommentsStore()

const body = ref('')
const files = ref<File[]>([])
const dropEl = ref<HTMLElement | null>(null)
const submitting = ref(false)

const previews = computed(() =>
  files.value.map((f) => ({
    name: f.name,
    size: f.size,
    url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
  })),
)

function onPaste(e: ClipboardEvent): void {
  const items = e.clipboardData?.items
  if (!items) return
  const added: File[] = []
  for (const it of items) {
    if (it.kind === 'file') {
      const f = it.getAsFile()
      if (f) added.push(f)
    }
  }
  if (added.length > 0) {
    files.value = [...files.value, ...added]
    e.preventDefault()
  }
}

useDropZone(dropEl, {
  onDrop: (dropped) => {
    if (dropped) files.value = [...files.value, ...dropped]
  },
  dataTypes: (types) => types.some((t) => t.startsWith('image/') || t === 'Files'),
})

function removeFile(i: number): void {
  files.value = files.value.filter((_, idx) => idx !== i)
}

async function submit(): Promise<void> {
  const text = body.value.trim()
  if (!text && files.value.length === 0) return
  submitting.value = true
  try {
    await commentsStore.create(props.taskId, { body: text || undefined, files: files.value })
    body.value = ''
    files.value = []
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div ref="dropEl" class="composer">
    <Textarea
      v-model="body"
      placeholder="Write a comment… (paste or drop images, Ctrl/Cmd+Enter to submit)"
      auto-resize
      rows="2"
      class="textarea"
      @paste="onPaste"
      @keydown.enter.exact.ctrl.prevent="submit"
      @keydown.enter.exact.meta.prevent="submit"
    />
    <div v-if="previews.length > 0" class="previews">
      <div v-for="(p, i) in previews" :key="i" class="preview">
        <img v-if="p.url" :src="p.url" alt="">
        <span v-else class="file-name">{{ p.name }}</span>
        <button class="rm" aria-label="Remove" @click="removeFile(i)">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>
    <div class="actions">
      <span class="muted hint">Ctrl/Cmd + Enter</span>
      <Button
        label="Comment"
        size="small"
        :disabled="submitting || (!body.trim() && files.length === 0)"
        @click="submit"
      />
    </div>
  </div>
</template>

<style scoped>
.composer {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px;
  background: var(--bg);
}
.textarea { width: 100%; }
.textarea :deep(textarea) { width: 100%; resize: vertical; min-height: 56px; border: none; box-shadow: none; padding: 6px 8px; }
.previews {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0;
}
.preview {
  position: relative;
  width: 96px;
  height: 96px;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview img { width: 100%; height: 100%; object-fit: cover; }
.file-name { font-size: 11px; padding: 4px; text-align: center; overflow: hidden; text-overflow: ellipsis; }
.rm {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.rm i { font-size: 10px; }
.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}
.hint { font-size: 11px; }
</style>
