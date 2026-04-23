import { createRouter, createWebHistory } from 'vue-router';
const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('./views/HomeRedirect.vue'),
    },
    {
        path: '/s/:spaceId',
        name: 'space',
        component: () => import('./views/SpaceView.vue'),
        props: true,
    },
    {
        path: '/s/:spaceId/l/:listId',
        name: 'list',
        component: () => import('./views/ListView.vue'),
        props: true,
    },
    {
        path: '/s/:spaceId/l/:listId/t/:taskId',
        name: 'task',
        component: () => import('./views/TaskView.vue'),
        props: true,
    },
];
export const router = createRouter({
    history: createWebHistory(),
    routes,
});
