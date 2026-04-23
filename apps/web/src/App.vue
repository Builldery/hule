<script setup lang="ts">
import { onMounted } from 'vue'
import AppSidebar from '@/sidebar/components/AppSidebar.vue'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import { UiModal, UiDeleteModal } from '@buildery/ui-kit/components'
import { useConfirmState, closeConfirm } from '@/app/compose/useConfirm'

const spacesStore = useSpacesStore()
const confirmState = useConfirmState()

onMounted(() => {
  void spacesStore.load()
})
</script>

<template>
  <div class="app-layout">
    <aside class="app-sidebar">
      <AppSidebar />
    </aside>
    <main class="app-main">
      <router-view />
    </main>

    <UiModal
      v-if="confirmState"
      :is-open="confirmState.visible"
      @close="closeConfirm(false)"
    >
      <UiDeleteModal
        :title="confirmState.title"
        :description="confirmState.description"
        :confirm-label="confirmState.confirmLabel ?? 'Delete'"
        :cancel-label="confirmState.cancelLabel ?? 'Cancel'"
        :on-close="(ok?: true) => closeConfirm(ok === true)"
      />
    </UiModal>
  </div>
</template>
