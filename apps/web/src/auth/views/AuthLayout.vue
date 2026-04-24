<script setup lang="ts">
import { UiCard } from '@buildery/ui-kit/components'

defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="auth-layout">
    <UiCard class="auth-card ui--single-card">
      <header class="auth-header">
        <h1>{{ title }}</h1>
        <p v-if="subtitle" class="muted">{{ subtitle }}</p>
      </header>
      <slot />
    </UiCard>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}
.auth-card {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.auth-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.auth-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}
.muted {
  color: #6b7280;
  font-size: 14px;
}
</style>
