import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { repo } from '../data/repo';
export const useTasksStore = defineStore('tasks', () => {
    const byList = ref({});
    const subtrees = ref({});
    const loadingLists = ref(new Set());
    const byId = computed(() => {
        const out = {};
        for (const arr of Object.values(byList.value)) {
            for (const t of arr)
                out[t.id] = t;
        }
        for (const arr of Object.values(subtrees.value)) {
            for (const t of arr)
                out[t.id] = t;
        }
        return out;
    });
    function getForList(listId) {
        return byList.value[listId] ?? [];
    }
    function getSubtree(rootId) {
        return subtrees.value[rootId] ?? [];
    }
    async function loadForList(listId, force = false) {
        if (byList.value[listId] && !force)
            return;
        if (loadingLists.value.has(listId))
            return;
        loadingLists.value.add(listId);
        try {
            const arr = await repo.tasks.listByList(listId, { includeSubtasks: true });
            byList.value = { ...byList.value, [listId]: arr };
        }
        finally {
            loadingLists.value.delete(listId);
        }
    }
    async function loadSubtree(rootId) {
        const arr = await repo.tasks.getSubtree(rootId);
        subtrees.value = { ...subtrees.value, [rootId]: arr };
    }
    function upsertInList(task) {
        const cur = byList.value[task.listId] ?? [];
        const exists = cur.some(t => t.id === task.id);
        const next = exists
            ? cur.map(t => (t.id === task.id ? task : t))
            : [...cur, task];
        byList.value = { ...byList.value, [task.listId]: next.sort(sortFn) };
    }
    function removeFromAll(id) {
        for (const lid of Object.keys(byList.value)) {
            byList.value[lid] = byList.value[lid].filter(t => t.id !== id);
        }
        for (const root of Object.keys(subtrees.value)) {
            subtrees.value[root] = subtrees.value[root].filter(t => t.id !== id);
        }
        byList.value = { ...byList.value };
        subtrees.value = { ...subtrees.value };
    }
    async function create(dto) {
        const created = await repo.tasks.create(dto);
        upsertInList(created);
        return created;
    }
    async function update(id, patch) {
        const updated = await repo.tasks.update(id, patch);
        upsertInList(updated);
        return updated;
    }
    async function move(id, dto) {
        await repo.tasks.move(id, dto);
        const task = byId.value[id];
        if (!task)
            return;
        const prevListId = task.listId;
        const nextListId = dto.listId ?? task.listId;
        const patched = {
            ...task,
            listId: nextListId,
            parentId: dto.parentId === undefined ? task.parentId : dto.parentId,
            order: dto.order,
        };
        if (prevListId !== nextListId) {
            byList.value[prevListId] = (byList.value[prevListId] ?? []).filter(t => t.id !== id);
        }
        upsertInList(patched);
    }
    async function remove(id) {
        await repo.tasks.remove(id);
        removeFromAll(id);
    }
    return {
        byList, subtrees, byId,
        getForList, getSubtree,
        loadForList, loadSubtree,
        create, update, move, remove,
    };
});
function sortFn(a, b) {
    if (a.parentId === null && b.parentId === null)
        return a.order - b.order;
    return a.depth - b.depth || a.order - b.order;
}
