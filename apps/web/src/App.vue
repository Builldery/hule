<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/sidebar/components/AppSidebar.vue'
import AppTopBar from '@/app/components/AppTopBar.vue'
import AuroraBackground from '@/app/components/AuroraBackground.vue'
import TaskView from '@/task/views/TaskView.vue'
import { UiCard, UiModal, UiDeleteModal } from '@buildery/ui-kit/components'
import { useConfirmState, closeConfirm } from '@/app/compose/useConfirm'
import { useTaskModalState, useTaskModal } from '@/app/compose/useTaskModal'

const route = useRoute()
const confirmState = useConfirmState()
const taskModalState = useTaskModalState()
const taskModal = useTaskModal()

const isAuthLayout = computed(() => route.meta?.layout === 'auth')
</script>

<template>
  <router-view v-if="isAuthLayout" />

  <div v-else class="app-layout">
    <AuroraBackground />
    <aside class="app-sidebar ui--single-card">
      <AppSidebar />
    </aside>
    <header class="app-topbar ui--single-card">
      <AppTopBar />
    </header>
    <main class="app-main ui--single-card">
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
