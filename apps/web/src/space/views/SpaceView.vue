<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { UiInfo, UiTreeView } from '@buildery/ui-kit/components'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import { useListsStore } from '@/list/store/useListsStore'
import ListTreeNode from '@/list/components/ListTreeNode.vue'

const props = defineProps<{ spaceId: string }>()

const spacesStore = useSpacesStore()
const listsStore = useListsStore()

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
  <section v-else-if="space" class="space-view">
    <h2 class="lists-heading">Lists</h2>
    <UiInfo v-if="lists.length === 0">No lists in this space yet.</UiInfo>
    <UiTreeView v-else>
      <ListTreeNode v-for="l in lists" :key="l.id" :list="l" />
    </UiTreeView>
  </section>
</template>

<style scoped>
.space-view {
  padding: 24px 32px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}
.lists-heading {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
}
</style>
