import { defineStore } from 'pinia';
import { ref } from 'vue';
import { repo } from '../data/repo';
export const useCommentsStore = defineStore('comments', () => {
    const byTask = ref({});
    const loadingTasks = ref(new Set());
    function getForTask(taskId) {
        return byTask.value[taskId] ?? [];
    }
    async function loadForTask(taskId, force = false) {
        if (byTask.value[taskId] && !force)
            return;
        if (loadingTasks.value.has(taskId))
            return;
        loadingTasks.value.add(taskId);
        try {
            const list = await repo.comments.listForTask(taskId);
            byTask.value = { ...byTask.value, [taskId]: list };
        }
        finally {
            loadingTasks.value.delete(taskId);
        }
    }
    async function create(taskId, dto) {
        const created = await repo.comments.create(taskId, dto);
        const cur = byTask.value[taskId] ?? [];
        byTask.value = { ...byTask.value, [taskId]: [...cur, created] };
        return created;
    }
    async function remove(commentId, taskId) {
        await repo.comments.remove(commentId);
        byTask.value = {
            ...byTask.value,
            [taskId]: (byTask.value[taskId] ?? []).filter(c => c.id !== commentId),
        };
    }
    return { byTask, getForTask, loadForTask, create, remove };
});
