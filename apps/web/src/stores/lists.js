import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { repo } from '../data/repo';
export const useListsStore = defineStore('lists', () => {
    const bySpace = ref({});
    const loadingSpaces = ref(new Set());
    const byId = computed(() => {
        const out = {};
        for (const lists of Object.values(bySpace.value)) {
            for (const l of lists)
                out[l.id] = l;
        }
        return out;
    });
    function getFor(spaceId) {
        return bySpace.value[spaceId] ?? [];
    }
    async function loadForSpace(spaceId, force = false) {
        if (bySpace.value[spaceId] && !force)
            return;
        if (loadingSpaces.value.has(spaceId))
            return;
        loadingSpaces.value.add(spaceId);
        try {
            const list = await repo.lists.listBySpace(spaceId);
            bySpace.value = { ...bySpace.value, [spaceId]: list };
        }
        finally {
            loadingSpaces.value.delete(spaceId);
        }
    }
    async function create(dto) {
        const created = await repo.lists.create(dto);
        const current = bySpace.value[dto.spaceId] ?? [];
        bySpace.value = {
            ...bySpace.value,
            [dto.spaceId]: [...current, created].sort((a, b) => a.order - b.order),
        };
        return created;
    }
    async function update(id, patch) {
        const updated = await repo.lists.update(id, patch);
        const sid = updated.spaceId;
        bySpace.value = {
            ...bySpace.value,
            [sid]: (bySpace.value[sid] ?? []).map(l => (l.id === id ? updated : l)),
        };
        return updated;
    }
    async function remove(id) {
        const existing = byId.value[id];
        if (!existing)
            return;
        const sid = existing.spaceId;
        const prev = bySpace.value[sid] ?? [];
        bySpace.value = { ...bySpace.value, [sid]: prev.filter(l => l.id !== id) };
        try {
            await repo.lists.remove(id);
        }
        catch (e) {
            bySpace.value = { ...bySpace.value, [sid]: prev };
            throw e;
        }
    }
    async function reorderInSpace(spaceId, items) {
        await repo.lists.reorder(items);
        const map = new Map(items.map(i => [i.id, i.order]));
        bySpace.value = {
            ...bySpace.value,
            [spaceId]: (bySpace.value[spaceId] ?? [])
                .map(l => ({ ...l, order: map.get(l.id) ?? l.order }))
                .sort((a, b) => a.order - b.order),
        };
    }
    return { bySpace, byId, getFor, loadForSpace, create, update, remove, reorderInSpace };
});
