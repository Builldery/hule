/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, watch } from 'vue';
import { useTasksStore } from '../../stores/tasks';
import { STATUS_OPTIONS } from '../../constants/tasks';
import KanbanColumn from './KanbanColumn.vue';
const props = defineProps();
const tasksStore = useTasksStore();
onMounted(() => {
    void tasksStore.loadForList(props.listId);
});
watch(() => props.listId, id => { void tasksStore.loadForList(id); });
const columns = computed(() => {
    const allTasks = tasksStore.getForList(props.listId).filter(t => t.parentId === null);
    return STATUS_OPTIONS.map(status => ({
        status,
        items: allTasks
            .filter(t => t.status === status.value)
            .sort((a, b) => a.order - b.order),
    }));
});
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "kanban" },
});
/** @type {__VLS_StyleScopedClasses['kanban']} */ ;
for (const [col] of __VLS_vFor((__VLS_ctx.columns))) {
    const __VLS_0 = KanbanColumn;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        key: (col.status.value),
        status: (col.status),
        items: (col.items),
    }));
    const __VLS_2 = __VLS_1({
        key: (col.status.value),
        status: (col.status),
        items: (col.items),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    // @ts-ignore
    [columns,];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
