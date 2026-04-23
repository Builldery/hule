<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useSpacesStore } from '../stores/spaces'

const spacesStore = useSpacesStore()
const router = useRouter()

const first = computed(() => spacesStore.items[0])

watchEffect(() => {
  if (spacesStore.loaded && first.value) {
    void router.replace({ name: 'space', params: { spaceId: first.value.id } })
  }
})
</script>

<template>
  <div class="empty-state">
    <h1>Welcome to Hule</h1>
    <p class="muted" v-if="!spacesStore.loaded">Loading…</p>
    <p class="muted" v-else-if="spacesStore.items.length === 0">
      Create your first space in the sidebar to get started.
    </p>
    <p class="muted" v-else>Opening {{ first?.name }}…</p>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 40px 32px;
  height: 100%;
  box-sizing: border-box;
}
h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}
</style>
