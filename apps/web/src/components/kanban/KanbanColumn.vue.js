/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { VueDraggable } from 'vue-draggable-plus';
import { useTasksStore } from '../../stores/tasks';
import KanbanCard from './KanbanCard.vue';
const props = defineProps();
const tasksStore = useTasksStore();
async function onAdd(event) {
    const id = event.item.dataset.taskId;
    if (!id)
        return;
    const task = tasksStore.byId[id];
    if (!task || task.status === props.status.value)
        return;
    try {
        await tasksStore.update(id, { status: props.status.value });
    }
    catch (e) {
        console.error('Failed to update status', e);
    }
}
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
    ...{ class: "kanban-column" },
});
/** @type {__VLS_StyleScopedClasses['kanban-column']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
    ...{ class: "col-head" },
});
/** @type {__VLS_StyleScopedClasses['col-head']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "dot" },
    ...{ style: ({ background: __VLS_ctx.status.color }) },
});
/** @type {__VLS_StyleScopedClasses['dot']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "col-title" },
});
/** @type {__VLS_StyleScopedClasses['col-title']} */ ;
(__VLS_ctx.status.label);
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "count muted" },
});
/** @type {__VLS_StyleScopedClasses['count']} */ ;
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
(__VLS_ctx.items.length);
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.VueDraggable | typeof __VLS_components.VueDraggable} */
VueDraggable;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onAdd': {} },
    modelValue: (__VLS_ctx.items),
    group: "tasks",
    animation: (150),
    ghostClass: "ghost",
    ...{ class: "col-body" },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onAdd': {} },
    modelValue: (__VLS_ctx.items),
    group: "tasks",
    animation: (150),
    ghostClass: "ghost",
    ...{ class: "col-body" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ add: {} },
    { onAdd: (__VLS_ctx.onAdd) });
/** @type {__VLS_StyleScopedClasses['col-body']} */ ;
const { default: __VLS_7 } = __VLS_3.slots;
for (const [t] of __VLS_vFor((__VLS_ctx.items))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (t.id),
        'data-task-id': (t.id),
    });
    const __VLS_8 = KanbanCard;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
        task: (t),
    }));
    const __VLS_10 = __VLS_9({
        task: (t),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    // @ts-ignore
    [status, status, items, items, items, onAdd,];
}
// @ts-ignore
[];
var __VLS_3;
var __VLS_4;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
