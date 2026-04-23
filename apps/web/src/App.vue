<script setup lang="ts">
import { onMounted } from 'vue'
import AppSidebar from '@/sidebar/components/AppSidebar.vue'
import TaskView from '@/task/views/TaskView.vue'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import { UiCard, UiModal, UiDeleteModal } from '@buildery/ui-kit/components'
import { useConfirmState, closeConfirm } from '@/app/compose/useConfirm'
import { useTaskModalState, useTaskModal } from '@/app/compose/useTaskModal'

const spacesStore = useSpacesStore()
const confirmState = useConfirmState()
const taskModalState = useTaskModalState()
const taskModal = useTaskModal()

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

    <UiModal
      :is-open="taskModalState !== null"
      :is-show-close-cross="true"
      @close="taskModal.close()"
    >
      <UiCard class="hule-task-modal-card ui--single-card ui--w-max__900px">
        <TaskView
          v-if="taskModalState"
          :space-id="taskModalState.spaceId"
          :list-id="taskModalState.listId"
          :task-id="taskModalState.taskId"
          modal
        />
      </UiCard>
    </UiModal>
  </div>
</template>

<style>
/* Teleported to body — non-scoped so the selector survives. */
.hule-task-modal-card {
  width: 95vw;
  max-height: 85vh;
}
</style>
