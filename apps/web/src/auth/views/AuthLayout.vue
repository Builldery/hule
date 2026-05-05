<script setup lang="ts">
import { UiCard } from '@buildery/ui-kit/components'
import AuroraBackground from '@/app/components/AuroraBackground.vue'

defineProps<{ title: string }>()
</script>

<template>
  <div class="auth-layout">
    <AuroraBackground />
    <UiCard :title="title" text-align="center" class="auth-card ui--single-card">
      <template #description>
        <slot name="description" />
      </template>
      <slot />
      <template #footer>
        <slot name="footer" />
      </template>
    </UiCard>
  </div>
</template>

<style scoped>
.auth-layout {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  background: #eef1ff;
  overflow: hidden;
}

.auth-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
}
</style>
