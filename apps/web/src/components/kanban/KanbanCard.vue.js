/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { priorityMeta } from '../../constants/tasks';
import { useTasksStore } from '../../stores/tasks';
import { useListsStore } from '../../stores/lists';
const props = defineProps();
const tasksStore = useTasksStore();
const listsStore = useListsStore();
const router = useRouter();
const subtaskCount = computed(() => tasksStore.getForList(props.task.listId).filter(t => t.path.includes(props.task.id)).length);
const dragging = ref(false);
let downX = 0;
let downY = 0;
function onMouseDown(e) {
    downX = e.clientX;
    downY = e.clientY;
    dragging.value = false;
}
function onMouseMove(e) {
    if (Math.abs(e.clientX - downX) > 4 || Math.abs(e.clientY - downY) > 4) {
        dragging.value = true;
    }
}
function onClick() {
    if (dragging.value)
        return;
    const list = listsStore.byId[props.task.listId];
    if (!list)
        return;
    void router.push({
        name: 'task',
        params: { spaceId: list.spaceId, listId: list.id, taskId: props.task.id },
    });
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
/** @type {__VLS_StyleScopedClasses['kanban-card']} */ ;
/** @type {__VLS_StyleScopedClasses['chip']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ onMousedown: (__VLS_ctx.onMouseDown) },
    ...{ onMousemove: (__VLS_ctx.onMouseMove) },
    ...{ onClick: (__VLS_ctx.onClick) },
    ...{ class: "kanban-card" },
});
/** @type {__VLS_StyleScopedClasses['kanban-card']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "title" },
});
/** @type {__VLS_StyleScopedClasses['title']} */ ;
(__VLS_ctx.task.title);
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "meta" },
});
/** @type {__VLS_StyleScopedClasses['meta']} */ ;
if (__VLS_ctx.task.priority !== 'none') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ class: "pi" },
        ...{ class: (__VLS_ctx.priorityMeta(__VLS_ctx.task.priority).icon) },
        ...{ style: ({ color: __VLS_ctx.priorityMeta(__VLS_ctx.task.priority).color }) },
    });
    /** @type {__VLS_StyleScopedClasses['pi']} */ ;
}
if (__VLS_ctx.subtaskCount > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "chip" },
    });
    /** @type {__VLS_StyleScopedClasses['chip']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ class: "pi pi-sitemap" },
    });
    /** @type {__VLS_StyleScopedClasses['pi']} */ ;
    /** @type {__VLS_StyleScopedClasses['pi-sitemap']} */ ;
    (__VLS_ctx.subtaskCount);
}
if (__VLS_ctx.task.dueDate) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "chip" },
    });
    /** @type {__VLS_StyleScopedClasses['chip']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ class: "pi pi-calendar" },
    });
    /** @type {__VLS_StyleScopedClasses['pi']} */ ;
    /** @type {__VLS_StyleScopedClasses['pi-calendar']} */ ;
    (new Date(__VLS_ctx.task.dueDate).toLocaleDateString());
}
// @ts-ignore
[onMouseDown, onMouseMove, onClick, task, task, task, task, task, task, priorityMeta, priorityMeta, subtaskCount, subtaskCount,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
