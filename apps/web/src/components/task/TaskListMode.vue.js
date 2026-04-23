/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, ref, watch } from 'vue';
import InputText from 'primevue/inputtext';
import { useTasksStore } from '../../stores/tasks';
import TaskRow from './TaskRow.vue';
const props = defineProps();
const tasksStore = useTasksStore();
const newTitle = ref('');
const rootTasks = computed(() => tasksStore
    .getForList(props.listId)
    .filter(t => t.parentId === null)
    .sort((a, b) => a.order - b.order));
onMounted(() => {
    void tasksStore.loadForList(props.listId);
});
watch(() => props.listId, (id) => {
    void tasksStore.loadForList(id);
});
async function createTask() {
    const title = newTitle.value.trim();
    if (!title)
        return;
    await tasksStore.create({ listId: props.listId, title });
    newTitle.value = '';
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
/** @type {__VLS_StyleScopedClasses['add-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "task-list" },
});
/** @type {__VLS_StyleScopedClasses['task-list']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "add-row" },
});
/** @type {__VLS_StyleScopedClasses['add-row']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.InputText} */
InputText;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onKeydown': {} },
    modelValue: (__VLS_ctx.newTitle),
    placeholder: "Add a task, press Enter",
    size: "small",
    ...{ class: "add-input" },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onKeydown': {} },
    modelValue: (__VLS_ctx.newTitle),
    placeholder: "Add a task, press Enter",
    size: "small",
    ...{ class: "add-input" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ keydown: {} },
    { onKeydown: (__VLS_ctx.createTask) });
/** @type {__VLS_StyleScopedClasses['add-input']} */ ;
var __VLS_3;
var __VLS_4;
if (__VLS_ctx.rootTasks.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "muted empty" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['empty']} */ ;
}
for (const [t] of __VLS_vFor((__VLS_ctx.rootTasks))) {
    const __VLS_7 = TaskRow;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        key: (t.id),
        task: (t),
    }));
    const __VLS_9 = __VLS_8({
        key: (t.id),
        task: (t),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    // @ts-ignore
    [newTitle, createTask, rootTasks, rootTasks,];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
