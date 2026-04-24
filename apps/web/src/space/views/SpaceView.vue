<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { UiButton, UiCard, UiInfo } from '@buildery/ui-kit/components'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import { useListsStore } from '@/list/store/useListsStore'

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
    <UiCard class="lists-card ui--single-card">
      <template #header>
        <h2 class="lists-heading">Lists</h2>
      </template>
      <UiInfo v-if="lists.length === 0">No lists in this space yet.</UiInfo>
      <ul v-else class="list-grid">
        <li v-for="l in lists" :key="l.id">
          <UiButton
            fill="text"
            color="gray"
            @click="router.push({ name: 'list', params: { spaceId: props.spaceId, listId: l.id } })"
          >
            <i class="pi pi-list" style="margin-right: 6px" />{{ l.name }}
          </UiButton>
        </li>
      </ul>
    </UiCard>
  </div>
</template>

<style scoped>
.space-view {
  padding: 24px 32px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}
.lists-heading { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.6px; }
.list-grid {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}
</style>
