import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { repo } from '../data/repo';
export const useSpacesStore = defineStore('spaces', () => {
    const items = ref([]);
    const loaded = ref(false);
    const loading = ref(false);
    const byId = computed(() => Object.fromEntries(items.value.map(s => [s.id, s])));
    async function load(force = false) {
        if (loaded.value && !force)
            return;
        loading.value = true;
        try {
            items.value = await repo.spaces.list();
            loaded.value = true;
        }
        finally {
            loading.value = false;
        }
    }
    async function create(dto) {
        const created = await repo.spaces.create(dto);
        items.value = [...items.value, created].sort((a, b) => a.order - b.order);
        return created;
    }
    async function update(id, patch) {
        const updated = await repo.spaces.update(id, patch);
        items.value = items.value.map(s => (s.id === id ? updated : s));
        return updated;
    }
    async function remove(id) {
        const prev = items.value;
        items.value = items.value.filter(s => s.id !== id);
        try {
            await repo.spaces.remove(id);
        }
        catch (e) {
            items.value = prev;
            throw e;
        }
    }
    async function reorder(nextItems) {
        await repo.spaces.reorder(nextItems);
        const map = new Map(nextItems.map(i => [i.id, i.order]));
        items.value = items.value
            .map(s => ({ ...s, order: map.get(s.id) ?? s.order }))
            .sort((a, b) => a.order - b.order);
    }
    return { items, loaded, loading, byId, load, create, update, remove, reorder };
});
