<script setup lang="ts">
import { onMounted } from 'vue'
import AppSidebar from './components/sidebar/AppSidebar.vue'
import { useSpacesStore } from './stores/spaces'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const spacesStore = useSpacesStore()

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
    <Toast />
    <ConfirmDialog />
  </div>
</template>
