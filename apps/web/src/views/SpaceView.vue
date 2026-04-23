<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useSpacesStore } from '../stores/spaces'
import { useListsStore } from '../stores/lists'

const props = defineProps<{ spaceId: string }>()

const spacesStore = useSpacesStore()
const listsStore = useListsStore()
const router = useRouter()

const space = computed(() => spacesStore.byId[props.spaceId])
const lists = computed(() => listsStore.getFor(props.spaceId))

onMounted(() => {
  void listsStore.loadForSpace(props.spaceId)
})
watch(() => props.spaceId, (id) => {
  void listsStore.loadForSpace(id)
})
</script>

<template>
  <div v-if="!space && spacesStore.loaded" class="muted">Space not found.</div>
  <div v-else-if="space" class="space-view">
    <header class="page-head">
      <h1>{{ space.name }}</h1>
    </header>

    <section>
      <h2>Lists</h2>
      <div v-if="lists.length === 0" class="muted">No lists in this space yet.</div>
      <ul class="list-grid">
        <li v-for="l in lists" :key="l.id">
          <Button
            :label="l.name"
            text
            severity="secondary"
            icon="pi pi-list"
            @click="router.push({ name: 'list', params: { spaceId: props.spaceId, listId: l.id } })"
          />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.space-view {
  padding: 24px 32px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}
.page-head { margin-bottom: 16px; }
h1 { margin: 0; font-size: 24px; font-weight: 600; }
h2 { margin: 0 0 8px; font-size: 14px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.6px; }
.list-grid {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}
</style>
