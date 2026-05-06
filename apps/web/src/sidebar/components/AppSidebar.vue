<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  UiIconButton,
  UiInfo,
  UiInput,
  UiTreeView,
} from '@buildery/ui-kit/components'
import { useRouter } from 'vue-router'
import { useToast } from '@/app/compose/useToast'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import { useViewsStore } from '@/view/store/useViewsStore'
import { usePinsStore } from '@/pin/store/usePinsStore'
import SpaceNode from '@/space/components/SpaceSidebarNode.vue'
import ViewSidebarItem from '@/view/components/ViewSidebarItem.vue'

const router = useRouter()
const spacesStore = useSpacesStore()
const viewsStore = useViewsStore()
const pinsStore = usePinsStore()
const toast = useToast()

// — space creation
const addingSpace = ref(false)
const newSpaceName = ref('')
const submittingSpace = ref(false)

// — view creation
const addingView = ref(false)
const newViewName = ref('')
const submittingView = ref(false)

onMounted(() => {
  void viewsStore.loadAll()
  void pinsStore.loadAll()
})

async function submitSpace(): Promise<void> {
  if (submittingSpace.value) return
  const name = newSpaceName.value.trim()
  if (!name) {
    addingSpace.value = false
    return
  }
  submittingSpace.value = true
  try {
    await spacesStore.create({ name })
    newSpaceName.value = ''
    addingSpace.value = false
  } catch (e) {
    toast.error(`Failed to create space: ${String(e)}`)
  } finally {
    submittingSpace.value = false
  }
}

function cancelSpace(): void {
  newSpaceName.value = ''
  addingSpace.value = false
}

async function submitView(): Promise<void> {
  if (submittingView.value) return
  const label = newViewName.value.trim()
  if (!label) {
    addingView.value = false
    return
  }
  submittingView.value = true
  try {
    const view = await viewsStore.create({ label, kind: 'list', listRefs: [] })
    newViewName.value = ''
    addingView.value = false
    await router.push({ name: 'view', params: { viewId: view.id } })
  } catch (e) {
    toast.error(`Failed to create view: ${String(e)}`)
  } finally {
    submittingView.value = false
  }
}

function cancelView(): void {
  newViewName.value = ''
  addingView.value = false
}
</script>

<template>
  <div class="sidebar">
    <!-- Spaces section -->
    <div class="sidebar-section-header">
      <span class="sidebar-section-label">Spaces</span>
      <UiIconButton
        v-if="!addingSpace"
        size="small"
        fill="outlined"
        title="Add space"
        icon-name="Plus"
        @click="addingSpace = true"
      />
    </div>

    <div v-if="addingSpace" class="sidebar-input">
      <UiInput
        :value="newSpaceName"
        placeholder="Space name"
        autofocus
        @update:value="(v: unknown) => newSpaceName = String(v ?? '')"
        @keydown.enter.stop="submitSpace"
        @keydown.escape="cancelSpace"
        @blur="submitSpace"
      />
    </div>

    <div v-if="spacesStore.loading && !spacesStore.loaded" class="sidebar-empty muted">Loading…</div>
    <UiInfo v-else-if="spacesStore.items.length === 0 && !addingSpace">
      No spaces yet
    </UiInfo>

    <UiTreeView v-else>
      <SpaceNode
        v-for="space in spacesStore.items"
        :key="space.id"
        :space="space"
      />
    </UiTreeView>

    <!-- Divider -->
    <div class="sidebar-divider" />

    <!-- Views section -->
    <div class="sidebar-section-header">
      <span class="sidebar-section-label">Views</span>
      <UiIconButton
        v-if="!addingView"
        size="small"
        fill="outlined"
        title="Create view"
        icon-name="Plus"
        @click="addingView = true"
      />
    </div>

    <div v-if="addingView" class="sidebar-input">
      <UiInput
        :value="newViewName"
        placeholder="View name"
        autofocus
        @update:value="(v: unknown) => newViewName = String(v ?? '')"
        @keydown.enter.stop="submitView"
        @keydown.escape="cancelView"
        @blur="submitView"
      />
    </div>

    <div v-if="viewsStore.loading && !viewsStore.loaded" class="sidebar-empty muted">Loading…</div>
    <UiInfo v-else-if="viewsStore.items.length === 0 && !addingView">
      No views yet
    </UiInfo>
    <div v-else class="sidebar-views">
      <ViewSidebarItem
        v-for="view in viewsStore.items"
        :key="view.id"
        :view="view"
      />
    </div>
  </div>
</template>

<style scoped>
.sidebar-input {
  padding: 4px 12px 8px;
}
.sidebar-empty {
  padding: 8px 16px;
  font-size: 13px;
}
.sidebar-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
}
.sidebar-section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-muted, #888);
}
.sidebar-divider {
  height: 1px;
  margin: 8px 0;
  background: rgba(128, 128, 128, 0.25);
  flex-shrink: 0;
}
.sidebar-views {
  display: flex;
  flex-direction: column;
}
:deep(.ui-tree-view-item__row) {
  gap: 4px;
}
</style>
