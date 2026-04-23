/// <reference types="../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import { useSpacesStore } from '../stores/spaces';
import { useListsStore } from '../stores/lists';
import { useTasksStore } from '../stores/tasks';
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from '../constants/tasks';
import TaskTreeNode from '../components/task/TaskTreeNode.vue';
import CommentsFeed from '../components/comments/CommentsFeed.vue';
const props = defineProps();
const spacesStore = useSpacesStore();
const listsStore = useListsStore();
const tasksStore = useTasksStore();
const router = useRouter();
const space = computed(() => spacesStore.byId[props.spaceId]);
const list = computed(() => listsStore.byId[props.listId]);
const task = computed(() => tasksStore.byId[props.taskId]);
const subtree = computed(() => {
    const all = tasksStore.getForList(props.listId);
    const root = all.find(t => t.id === props.taskId);
    if (!root)
        return [];
    return [root, ...all.filter(t => t.path.includes(props.taskId))];
});
const children = computed(() => subtree.value
    .filter(t => t.parentId === props.taskId)
    .sort((a, b) => a.order - b.order));
const editingTitle = ref(false);
const titleDraft = ref('');
watch(task, (t) => { if (t)
    titleDraft.value = t.title; }, { immediate: true });
const descDraft = ref('');
watch(task, (t) => { if (t)
    descDraft.value = t.description ?? ''; }, { immediate: true });
const newSubtaskTitle = ref('');
onMounted(async () => {
    void spacesStore.load();
    void listsStore.loadForSpace(props.spaceId);
    await tasksStore.loadForList(props.listId);
});
watch(() => props.listId, async (id) => { await tasksStore.loadForList(id); });
async function saveTitle() {
    if (!task.value)
        return;
    const v = titleDraft.value.trim();
    if (!v || v === task.value.title) {
        titleDraft.value = task.value.title;
        editingTitle.value = false;
        return;
    }
    await tasksStore.update(props.taskId, { title: v });
    editingTitle.value = false;
}
async function saveDescription() {
    if (!task.value)
        return;
    if ((task.value.description ?? '') === descDraft.value)
        return;
    await tasksStore.update(props.taskId, { description: descDraft.value || null });
}
async function onStatusChange(v) {
    await tasksStore.update(props.taskId, { status: v });
}
async function onPriorityChange(v) {
    await tasksStore.update(props.taskId, { priority: v });
}
async function onStartDate(d) {
    await tasksStore.update(props.taskId, { startDate: d ? d.toISOString() : null });
}
async function onDueDate(d) {
    await tasksStore.update(props.taskId, { dueDate: d ? d.toISOString() : null });
}
async function addSubtask() {
    const v = newSubtaskTitle.value.trim();
    if (!v)
        return;
    await tasksStore.create({ listId: props.listId, parentId: props.taskId, title: v });
    newSubtaskTitle.value = '';
}
function back() {
    // Prefer history-back so we return to whatever view the user came from
    // (keeps the ?view=kanban/timeline query they were on). Fall back to the
    // plain list route when there's no history entry (e.g. direct deep-link).
    const fromInternal = window.history.state?.back != null;
    if (fromInternal) {
        router.back();
        return;
    }
    void router.push({ name: 'list', params: { spaceId: props.spaceId, listId: props.listId } });
}
const startDateValue = computed({
    get: () => task.value?.startDate ? new Date(task.value.startDate) : null,
    set: () => { },
});
const dueDateValue = computed({
    get: () => task.value?.dueDate ? new Date(task.value.dueDate) : null,
    set: () => { },
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
/** @type {__VLS_StyleScopedClasses['breadcrumb']} */ ;
/** @type {__VLS_StyleScopedClasses['breadcrumb']} */ ;
/** @type {__VLS_StyleScopedClasses['title-input']} */ ;
/** @type {__VLS_StyleScopedClasses['field']} */ ;
/** @type {__VLS_StyleScopedClasses['desc']} */ ;
/** @type {__VLS_StyleScopedClasses['add-input']} */ ;
/** @type {__VLS_StyleScopedClasses['p-inputtext']} */ ;
if (__VLS_ctx.task) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "task-view" },
    });
    /** @type {__VLS_StyleScopedClasses['task-view']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "head" },
    });
    /** @type {__VLS_StyleScopedClasses['head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "breadcrumb muted" },
    });
    /** @type {__VLS_StyleScopedClasses['breadcrumb']} */ ;
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        to: ({ name: 'space', params: { spaceId: props.spaceId } }),
    }));
    const __VLS_2 = __VLS_1({
        to: ({ name: 'space', params: { spaceId: props.spaceId } }),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const { default: __VLS_5 } = __VLS_3.slots;
    (__VLS_ctx.space?.name);
    // @ts-ignore
    [task, space,];
    var __VLS_3;
    let __VLS_6;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent1(__VLS_6, new __VLS_6({
        to: ({ name: 'list', params: { spaceId: props.spaceId, listId: props.listId } }),
    }));
    const __VLS_8 = __VLS_7({
        to: ({ name: 'list', params: { spaceId: props.spaceId, listId: props.listId } }),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    const { default: __VLS_11 } = __VLS_9.slots;
    (__VLS_ctx.list?.name);
    // @ts-ignore
    [list,];
    var __VLS_9;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "title-row" },
    });
    /** @type {__VLS_StyleScopedClasses['title-row']} */ ;
    let __VLS_12;
    /** @ts-ignore @type {typeof __VLS_components.Button} */
    Button;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent1(__VLS_12, new __VLS_12({
        ...{ 'onClick': {} },
        icon: "pi pi-arrow-left",
        text: true,
        severity: "secondary",
        size: "small",
    }));
    const __VLS_14 = __VLS_13({
        ...{ 'onClick': {} },
        icon: "pi pi-arrow-left",
        text: true,
        severity: "secondary",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    let __VLS_17;
    const __VLS_18 = ({ click: {} },
        { onClick: (__VLS_ctx.back) });
    var __VLS_15;
    var __VLS_16;
    if (__VLS_ctx.editingTitle) {
        let __VLS_19;
        /** @ts-ignore @type {typeof __VLS_components.InputText} */
        InputText;
        // @ts-ignore
        const __VLS_20 = __VLS_asFunctionalComponent1(__VLS_19, new __VLS_19({
            ...{ 'onKeydown': {} },
            ...{ 'onKeydown': {} },
            ...{ 'onBlur': {} },
            modelValue: (__VLS_ctx.titleDraft),
            ...{ class: "title-input" },
            autofocus: true,
        }));
        const __VLS_21 = __VLS_20({
            ...{ 'onKeydown': {} },
            ...{ 'onKeydown': {} },
            ...{ 'onBlur': {} },
            modelValue: (__VLS_ctx.titleDraft),
            ...{ class: "title-input" },
            autofocus: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_20));
        let __VLS_24;
        const __VLS_25 = ({ keydown: {} },
            { onKeydown: (__VLS_ctx.saveTitle) });
        const __VLS_26 = ({ keydown: {} },
            { onKeydown: (() => { __VLS_ctx.titleDraft = __VLS_ctx.task.title; __VLS_ctx.editingTitle = false; }) });
        const __VLS_27 = ({ blur: {} },
            { onBlur: (__VLS_ctx.saveTitle) });
        /** @type {__VLS_StyleScopedClasses['title-input']} */ ;
        var __VLS_22;
        var __VLS_23;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.task))
                        return;
                    if (!!(__VLS_ctx.editingTitle))
                        return;
                    __VLS_ctx.editingTitle = true;
                    // @ts-ignore
                    [task, back, editingTitle, editingTitle, editingTitle, titleDraft, titleDraft, saveTitle, saveTitle,];
                } },
        });
        (__VLS_ctx.task.title);
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "fields" },
    });
    /** @type {__VLS_StyleScopedClasses['fields']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field" },
    });
    /** @type {__VLS_StyleScopedClasses['field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    let __VLS_28;
    /** @ts-ignore @type {typeof __VLS_components.Select} */
    Select;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent1(__VLS_28, new __VLS_28({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_ctx.task.status),
        options: (__VLS_ctx.STATUS_OPTIONS),
        optionLabel: "label",
        optionValue: "value",
        size: "small",
    }));
    const __VLS_30 = __VLS_29({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_ctx.task.status),
        options: (__VLS_ctx.STATUS_OPTIONS),
        optionLabel: "label",
        optionValue: "value",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    let __VLS_33;
    const __VLS_34 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.onStatusChange) });
    var __VLS_31;
    var __VLS_32;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field" },
    });
    /** @type {__VLS_StyleScopedClasses['field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    let __VLS_35;
    /** @ts-ignore @type {typeof __VLS_components.Select} */
    Select;
    // @ts-ignore
    const __VLS_36 = __VLS_asFunctionalComponent1(__VLS_35, new __VLS_35({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_ctx.task.priority),
        options: (__VLS_ctx.PRIORITY_OPTIONS),
        optionLabel: "label",
        optionValue: "value",
        size: "small",
    }));
    const __VLS_37 = __VLS_36({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_ctx.task.priority),
        options: (__VLS_ctx.PRIORITY_OPTIONS),
        optionLabel: "label",
        optionValue: "value",
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_36));
    let __VLS_40;
    const __VLS_41 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': (__VLS_ctx.onPriorityChange) });
    var __VLS_38;
    var __VLS_39;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field" },
    });
    /** @type {__VLS_StyleScopedClasses['field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    let __VLS_42;
    /** @ts-ignore @type {typeof __VLS_components.DatePicker} */
    DatePicker;
    // @ts-ignore
    const __VLS_43 = __VLS_asFunctionalComponent1(__VLS_42, new __VLS_42({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_ctx.startDateValue),
        showIcon: true,
        showButtonBar: true,
        size: "small",
    }));
    const __VLS_44 = __VLS_43({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_ctx.startDateValue),
        showIcon: true,
        showButtonBar: true,
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_43));
    let __VLS_47;
    const __VLS_48 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': ((v) => __VLS_ctx.onStartDate(Array.isArray(v) ? v[0] : v)) });
    var __VLS_45;
    var __VLS_46;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "field" },
    });
    /** @type {__VLS_StyleScopedClasses['field']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.label, __VLS_intrinsics.label)({});
    let __VLS_49;
    /** @ts-ignore @type {typeof __VLS_components.DatePicker} */
    DatePicker;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent1(__VLS_49, new __VLS_49({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_ctx.dueDateValue),
        showIcon: true,
        showButtonBar: true,
        size: "small",
    }));
    const __VLS_51 = __VLS_50({
        ...{ 'onUpdate:modelValue': {} },
        modelValue: (__VLS_ctx.dueDateValue),
        showIcon: true,
        showButtonBar: true,
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    let __VLS_54;
    const __VLS_55 = ({ 'update:modelValue': {} },
        { 'onUpdate:modelValue': ((v) => __VLS_ctx.onDueDate(Array.isArray(v) ? v[0] : v)) });
    var __VLS_52;
    var __VLS_53;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section" },
    });
    /** @type {__VLS_StyleScopedClasses['section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    let __VLS_56;
    /** @ts-ignore @type {typeof __VLS_components.Textarea} */
    Textarea;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent1(__VLS_56, new __VLS_56({
        ...{ 'onBlur': {} },
        modelValue: (__VLS_ctx.descDraft),
        autoResize: true,
        rows: "3",
        placeholder: "Add a description",
        ...{ class: "desc" },
    }));
    const __VLS_58 = __VLS_57({
        ...{ 'onBlur': {} },
        modelValue: (__VLS_ctx.descDraft),
        autoResize: true,
        rows: "3",
        placeholder: "Add a description",
        ...{ class: "desc" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    let __VLS_61;
    const __VLS_62 = ({ blur: {} },
        { onBlur: (__VLS_ctx.saveDescription) });
    /** @type {__VLS_StyleScopedClasses['desc']} */ ;
    var __VLS_59;
    var __VLS_60;
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section" },
    });
    /** @type {__VLS_StyleScopedClasses['section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "muted count" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['count']} */ ;
    (__VLS_ctx.subtree.length - 1);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "add-subtask" },
    });
    /** @type {__VLS_StyleScopedClasses['add-subtask']} */ ;
    let __VLS_63;
    /** @ts-ignore @type {typeof __VLS_components.InputText} */
    InputText;
    // @ts-ignore
    const __VLS_64 = __VLS_asFunctionalComponent1(__VLS_63, new __VLS_63({
        ...{ 'onKeydown': {} },
        modelValue: (__VLS_ctx.newSubtaskTitle),
        placeholder: "Add a subtask, press Enter",
        size: "small",
        ...{ class: "add-input" },
    }));
    const __VLS_65 = __VLS_64({
        ...{ 'onKeydown': {} },
        modelValue: (__VLS_ctx.newSubtaskTitle),
        placeholder: "Add a subtask, press Enter",
        size: "small",
        ...{ class: "add-input" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_64));
    let __VLS_68;
    const __VLS_69 = ({ keydown: {} },
        { onKeydown: (__VLS_ctx.addSubtask) });
    /** @type {__VLS_StyleScopedClasses['add-input']} */ ;
    var __VLS_66;
    var __VLS_67;
    if (__VLS_ctx.children.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "muted" },
        });
        /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    }
    for (const [c] of __VLS_vFor((__VLS_ctx.children))) {
        const __VLS_70 = TaskTreeNode;
        // @ts-ignore
        const __VLS_71 = __VLS_asFunctionalComponent1(__VLS_70, new __VLS_70({
            key: (c.id),
            task: (c),
            all: (__VLS_ctx.subtree),
        }));
        const __VLS_72 = __VLS_71({
            key: (c.id),
            task: (c),
            all: (__VLS_ctx.subtree),
        }, ...__VLS_functionalComponentArgsRest(__VLS_71));
        // @ts-ignore
        [task, task, task, STATUS_OPTIONS, onStatusChange, PRIORITY_OPTIONS, onPriorityChange, startDateValue, onStartDate, dueDateValue, onDueDate, descDraft, saveDescription, subtree, subtree, newSubtaskTitle, addSubtask, children, children,];
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({
        ...{ class: "section" },
    });
    /** @type {__VLS_StyleScopedClasses['section']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    const __VLS_75 = CommentsFeed;
    // @ts-ignore
    const __VLS_76 = __VLS_asFunctionalComponent1(__VLS_75, new __VLS_75({
        taskId: (props.taskId),
    }));
    const __VLS_77 = __VLS_76({
        taskId: (props.taskId),
    }, ...__VLS_functionalComponentArgsRest(__VLS_76));
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "muted" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
