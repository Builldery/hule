/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, statusMeta, priorityMeta } from '../../constants/tasks';
import { useTasksStore } from '../../stores/tasks';
import { useListsStore } from '../../stores/lists';
const props = defineProps();
const tasksStore = useTasksStore();
const listsStore = useListsStore();
const router = useRouter();
const subtaskCount = computed(() => tasksStore.getForList(props.task.listId).filter(t => t.path.includes(props.task.id)).length);
function open() {
    const list = listsStore.byId[props.task.listId];
    if (!list)
        return;
    void router.push({
        name: 'task',
        params: { spaceId: list.spaceId, listId: list.id, taskId: props.task.id },
    });
}
const editing = ref(false);
const titleDraft = ref(props.task.title);
watch(() => props.task.title, v => { titleDraft.value = v; });
async function saveTitle() {
    const v = titleDraft.value.trim();
    if (!v || v === props.task.title) {
        titleDraft.value = props.task.title;
        editing.value = false;
        return;
    }
    await tasksStore.update(props.task.id, { title: v });
    editing.value = false;
}
async function onStatusChange(v) {
    await tasksStore.update(props.task.id, { status: v });
}
async function onPriorityChange(v) {
    await tasksStore.update(props.task.id, { priority: v });
}
async function toggleDone() {
    const next = props.task.status === 'done' ? 'todo' : 'done';
    await tasksStore.update(props.task.id, { status: next });
}
async function remove() {
    await tasksStore.remove(props.task.id);
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
/** @type {__VLS_StyleScopedClasses['subcount']} */ ;
/** @type {__VLS_StyleScopedClasses['task-row']} */ ;
/** @type {__VLS_StyleScopedClasses['check']} */ ;
/** @type {__VLS_StyleScopedClasses['check']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['title']} */ ;
/** @type {__VLS_StyleScopedClasses['p-select-label']} */ ;
/** @type {__VLS_StyleScopedClasses['del']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "task-row" },
    ...{ class: ({ done: __VLS_ctx.task.status === 'done' }) },
});
/** @type {__VLS_StyleScopedClasses['task-row']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.toggleDone) },
    ...{ class: "check" },
    ...{ class: ({ checked: __VLS_ctx.task.status === 'done' }) },
    'aria-label': ('Toggle done'),
});
/** @type {__VLS_StyleScopedClasses['check']} */ ;
/** @type {__VLS_StyleScopedClasses['checked']} */ ;
if (__VLS_ctx.task.status === 'done') {
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ class: "pi pi-check" },
    });
    /** @type {__VLS_StyleScopedClasses['pi']} */ ;
    /** @type {__VLS_StyleScopedClasses['pi-check']} */ ;
}
if (__VLS_ctx.editing) {
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.InputText} */
    InputText;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onKeydown': {} },
        ...{ 'onKeydown': {} },
        ...{ 'onBlur': {} },
        modelValue: (__VLS_ctx.titleDraft),
        size: "small",
        ...{ class: "title-input" },
        autofocus: true,
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onKeydown': {} },
        ...{ 'onKeydown': {} },
        ...{ 'onBlur': {} },
        modelValue: (__VLS_ctx.titleDraft),
        size: "small",
        ...{ class: "title-input" },
        autofocus: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ keydown: {} },
        { onKeydown: (__VLS_ctx.saveTitle) });
    const __VLS_7 = ({ keydown: {} },
        { onKeydown: (() => { __VLS_ctx.titleDraft = props.task.title; __VLS_ctx.editing = false; }) });
    const __VLS_8 = ({ blur: {} },
        { onBlur: (__VLS_ctx.saveTitle) });
    /** @type {__VLS_StyleScopedClasses['title-input']} */ ;
    var __VLS_3;
    var __VLS_4;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.editing))
                    return;
                __VLS_ctx.editing = true;
                // @ts-ignore
                [task, task, task, toggleDone, editing, editing, editing, titleDraft, titleDraft, saveTitle, saveTitle,];
            } },
        ...{ class: "title" },
    });
    /** @type {__VLS_StyleScopedClasses['title']} */ ;
    (__VLS_ctx.task.title);
    if (__VLS_ctx.subtaskCount > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "subcount muted" },
        });
        /** @type {__VLS_StyleScopedClasses['subcount']} */ ;
        /** @type {__VLS_StyleScopedClasses['muted']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
            ...{ class: "pi pi-sitemap" },
        });
        /** @type {__VLS_StyleScopedClasses['pi']} */ ;
        /** @type {__VLS_StyleScopedClasses['pi-sitemap']} */ ;
        (__VLS_ctx.subtaskCount);
    }
}
let __VLS_9;
/** @ts-ignore @type {typeof __VLS_components.Select | typeof __VLS_components.Select} */
Select;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.task.status),
    options: (__VLS_ctx.STATUS_OPTIONS),
    optionLabel: "label",
    optionValue: "value",
    size: "small",
    ...{ class: "pill" },
}));
const __VLS_11 = __VLS_10({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.task.status),
    options: (__VLS_ctx.STATUS_OPTIONS),
    optionLabel: "label",
    optionValue: "value",
    size: "small",
    ...{ class: "pill" },
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
let __VLS_14;
const __VLS_15 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onStatusChange) });
/** @type {__VLS_StyleScopedClasses['pill']} */ ;
const { default: __VLS_16 } = __VLS_12.slots;
{
    const { value: __VLS_17 } = __VLS_12.slots;
    const [s] = __VLS_vSlot(__VLS_17);
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "pill-inner" },
        ...{ style: ({ background: __VLS_ctx.statusMeta(__VLS_ctx.task.status).color }) },
    });
    /** @type {__VLS_StyleScopedClasses['pill-inner']} */ ;
    (s.placeholder ? s.placeholder : __VLS_ctx.statusMeta(__VLS_ctx.task.status).label);
    // @ts-ignore
    [task, task, task, task, subtaskCount, subtaskCount, STATUS_OPTIONS, onStatusChange, statusMeta, statusMeta,];
}
// @ts-ignore
[];
var __VLS_12;
var __VLS_13;
let __VLS_18;
/** @ts-ignore @type {typeof __VLS_components.Select | typeof __VLS_components.Select} */
Select;
// @ts-ignore
const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.task.priority),
    options: (__VLS_ctx.PRIORITY_OPTIONS),
    optionLabel: "label",
    optionValue: "value",
    size: "small",
    ...{ class: "priority" },
}));
const __VLS_20 = __VLS_19({
    ...{ 'onUpdate:modelValue': {} },
    modelValue: (__VLS_ctx.task.priority),
    options: (__VLS_ctx.PRIORITY_OPTIONS),
    optionLabel: "label",
    optionValue: "value",
    size: "small",
    ...{ class: "priority" },
}, ...__VLS_functionalComponentArgsRest(__VLS_19));
let __VLS_23;
const __VLS_24 = ({ 'update:modelValue': {} },
    { 'onUpdate:modelValue': (__VLS_ctx.onPriorityChange) });
/** @type {__VLS_StyleScopedClasses['priority']} */ ;
const { default: __VLS_25 } = __VLS_21.slots;
{
    const { value: __VLS_26 } = __VLS_21.slots;
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ class: "pi" },
        ...{ class: (__VLS_ctx.priorityMeta(__VLS_ctx.task.priority).icon) },
        ...{ style: ({ color: __VLS_ctx.priorityMeta(__VLS_ctx.task.priority).color, opacity: __VLS_ctx.task.priority === 'none' ? 0.3 : 1 }) },
    });
    /** @type {__VLS_StyleScopedClasses['pi']} */ ;
    // @ts-ignore
    [task, task, task, task, PRIORITY_OPTIONS, onPriorityChange, priorityMeta, priorityMeta,];
}
{
    const { option: __VLS_27 } = __VLS_21.slots;
    const [o] = __VLS_vSlot(__VLS_27);
    __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
        ...{ class: "pi" },
        ...{ class: (o.option.icon) },
        ...{ style: ({ color: o.option.color }) },
    });
    /** @type {__VLS_StyleScopedClasses['pi']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ style: {} },
    });
    (o.option.label);
    // @ts-ignore
    [];
}
// @ts-ignore
[];
var __VLS_21;
var __VLS_22;
let __VLS_28;
/** @ts-ignore @type {typeof __VLS_components.Button} */
Button;
// @ts-ignore
const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
    ...{ 'onClick': {} },
    icon: "pi pi-arrow-up-right",
    text: true,
    severity: "secondary",
    size: "small",
    ...{ class: "del" },
    'aria-label': "Open task",
}));
const __VLS_30 = __VLS_29({
    ...{ 'onClick': {} },
    icon: "pi pi-arrow-up-right",
    text: true,
    severity: "secondary",
    size: "small",
    ...{ class: "del" },
    'aria-label': "Open task",
}, ...__VLS_functionalComponentArgsRest(__VLS_29));
let __VLS_33;
const __VLS_34 = ({ click: {} },
    { onClick: (__VLS_ctx.open) });
/** @type {__VLS_StyleScopedClasses['del']} */ ;
var __VLS_31;
var __VLS_32;
let __VLS_35;
/** @ts-ignore @type {typeof __VLS_components.Button} */
Button;
// @ts-ignore
const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
    ...{ 'onClick': {} },
    icon: "pi pi-trash",
    text: true,
    severity: "secondary",
    size: "small",
    ...{ class: "del" },
    'aria-label': "Delete task",
}));
const __VLS_37 = __VLS_36({
    ...{ 'onClick': {} },
    icon: "pi pi-trash",
    text: true,
    severity: "secondary",
    size: "small",
    ...{ class: "del" },
    'aria-label': "Delete task",
}, ...__VLS_functionalComponentArgsRest(__VLS_36));
let __VLS_40;
const __VLS_41 = ({ click: {} },
    { onClick: (__VLS_ctx.remove) });
/** @type {__VLS_StyleScopedClasses['del']} */ ;
var __VLS_38;
var __VLS_39;
// @ts-ignore
[open, remove,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
