import { createRouter, createWebHistory, type RouteLocationNormalized, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/auth/store/useAuthStore'
import { useWorkspacesStore } from '@/workspace/store/useWorkspacesStore'
import { useSpacesStore } from '@/space/store/useSpacesStore'
import { HttpError } from '@/app/api/httpClient'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/auth/views/LoginView.vue'),
    meta: { public: true, layout: 'auth' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/auth/views/RegisterView.vue'),
    meta: { public: true, layout: 'auth' },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/app/views/HomeRedirect.vue'),
  },
  {
    path: '/s/:spaceId',
    name: 'space',
    component: () => import('@/space/views/SpaceView.vue'),
    props: true,
  },
  {
    path: '/s/:spaceId/l/:listId',
    name: 'list',
    component: () => import('@/list/views/ListView.vue'),
    props: true,
  },
  {
    path: '/s/:spaceId/l/:listId/t/:taskId',
    name: 'task',
    component: () => import('@/task/views/TaskView.vue'),
    props: true,
  },
  {
    path: '/v/:viewId',
    name: 'view',
    component: () => import('@/view/views/ViewPage.vue'),
    props: true,
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

function isPublic(to: RouteLocationNormalized): boolean {
  return to.meta?.public === true
}

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const workspacesStore = useWorkspacesStore()

  if (!authStore.token) {
    if (isPublic(to)) return true
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined }
  }

  if (!authStore.user) {
    try {
      await authStore.loadMe()
    } catch (err) {
      authStore.logout()
      if (err instanceof HttpError && err.status === 401) {
        return { name: 'login' }
      }
      return { name: 'login' }
    }
  }

  if (!workspacesStore.loaded) {
    try {
      await workspacesStore.load()
    } catch (err) {
      if (err instanceof HttpError && err.status === 401) {
        authStore.logout()
        return { name: 'login' }
      }
      throw err
    }
  }

  if (isPublic(to)) {
    return { name: 'home' }
  }

  if (workspacesStore.currentWorkspaceId) {
    const spacesStore = useSpacesStore()
    try {
      await spacesStore.load()
    } catch (err) {
      if (err instanceof HttpError && err.status === 401) {
        authStore.logout()
        return { name: 'login' }
      }
      throw err
    }
  }

  return true
})
