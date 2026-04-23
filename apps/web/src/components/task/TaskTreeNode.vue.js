/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { STATUS_OPTIONS, statusMeta } from '../../constants/tasks';
import { useTasksStore } from '../../stores/tasks';
import { useListsStore } from '../../stores/lists';
export default {};
const __VLS_self = (await import('vue')).defineComponent({ name: 'TaskTreeNode' });
const __VLS_export = await (async () => {
    const props = defineProps();
    const tasksStore = useTasksStore();
    const listsStore = useListsStore();
    const router = useRouter();
    function open() {
        const list = listsStore.byId[props.task.listId];
        if (!list)
            return;
        void router.push({
            name: 'task',
            params: { spaceId: list.spaceId, listId: list.id, taskId: props.task.id },
        });
    }
    const children = computed(() => props.all
        .filter(t => t.parentId === props.task.id)
        .sort((a, b) => a.order - b.order));
    const doneCount = computed(() => children.value.filter(c => c.status === 'done').length);
    const expanded = ref(true);
    const addingSubtask = ref(false);
    const subtaskTitle = ref('');
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
    async function toggleDone() {
        const next = props.task.status === 'done' ? 'todo' : 'done';
        await tasksStore.update(props.task.id, { status: next });
    }
    async function onStatusChange(v) {
        await tasksStore.update(props.task.id, { status: v });
    }
    async function addSubtask() {
        const v = subtaskTitle.value.trim();
        if (!v) {
            addingSubtask.value = false;
            return;
        }
        await tasksStore.create({
            listId: props.task.listId,
            parentId: props.task.id,
            title: v,
        });
        subtaskTitle.value = '';
        addingSubtask.value = false;
        expanded.value = true;
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
    /** @type {__VLS_StyleScopedClasses['chev']} */ ;
    /** @type {__VLS_StyleScopedClasses['chev']} */ ;
    /** @type {__VLS_StyleScopedClasses['check']} */ ;
    /** @type {__VLS_StyleScopedClasses['check']} */ ;
    /** @type {__VLS_StyleScopedClasses['title']} */ ;
    /** @type {__VLS_StyleScopedClasses['title']} */ ;
    /** @type {__VLS_StyleScopedClasses['title-input']} */ ;
    /** @type {__VLS_StyleScopedClasses['tree-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['act']} */ ;
    /** @type {__VLS_StyleScopedClasses['add-child']} */ ;
    /** @type {__VLS_StyleScopedClasses['p-inputtext']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tree-node" },
    });
    /** @type {__VLS_StyleScopedClasses['tree-node']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "tree-row" },
        ...{ class: ({ done: __VLS_ctx.task.status === 'done' }) },
    });
    /** @type {__VLS_StyleScopedClasses['tree-row']} */ ;
    /** @type {__VLS_StyleScopedClasses['done']} */ ;
    if (__VLS_ctx.children.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.children.length > 0))
                        return;
                    __VLS_ctx.expanded = !__VLS_ctx.expanded;
                    // @ts-ignore
                    [task, children, expanded, expanded,];
                } },
            ...{ class: "chev" },
            'aria-label': (__VLS_ctx.expanded ? 'Collapse' : 'Expand'),
        });
        /** @type {__VLS_StyleScopedClasses['chev']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
            ...{ class: "pi" },
            ...{ class: (__VLS_ctx.expanded ? 'pi-chevron-down' : 'pi-chevron-right') },
        });
        /** @type {__VLS_StyleScopedClasses['pi']} */ ;
    }
    else {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "chev placeholder" },
        });
        /** @type {__VLS_StyleScopedClasses['chev']} */ ;
        /** @type {__VLS_StyleScopedClasses['placeholder']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
        ...{ onClick: (__VLS_ctx.toggleDone) },
        ...{ class: "check" },
        ...{ class: ({ checked: __VLS_ctx.task.status === 'done' }) },
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
                    [task, task, expanded, expanded, toggleDone, editing, editing, editing, titleDraft, titleDraft, saveTitle, saveTitle,];
                } },
            ...{ class: "title" },
        });
        /** @type {__VLS_StyleScopedClasses['title']} */ ;
        (__VLS_ctx.task.title);
    }
    if (__VLS_ctx.children.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "count muted" },
        });
        /** @type {__VLS_StyleScopedClasses['count']} */ ;
        /** @type {__VLS_StyleScopedClasses['muted']} */ ;
        (__VLS_ctx.doneCount);
        (__VLS_ctx.children.length);
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
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "pill-inner" },
            ...{ style: ({ background: __VLS_ctx.statusMeta(__VLS_ctx.task.status).color }) },
        });
        /** @type {__VLS_StyleScopedClasses['pill-inner']} */ ;
        (__VLS_ctx.statusMeta(__VLS_ctx.task.status).label);
        // @ts-ignore
        [task, task, task, task, children, children, doneCount, STATUS_OPTIONS, onStatusChange, statusMeta, statusMeta,];
    }
    // @ts-ignore
    [];
    var __VLS_12;
    var __VLS_13;
    let __VLS_18;
    /** @ts-ignore @type {typeof __VLS_components.Button} */
    Button;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent1(__VLS_18, new __VLS_18({
        ...{ 'onClick': {} },
        icon: "pi pi-plus",
        size: "small",
        text: true,
        severity: "secondary",
        ...{ class: "act" },
        'aria-label': "Add subtask",
    }));
    const __VLS_20 = __VLS_19({
        ...{ 'onClick': {} },
        icon: "pi pi-plus",
        size: "small",
        text: true,
        severity: "secondary",
        ...{ class: "act" },
        'aria-label': "Add subtask",
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    let __VLS_23;
    const __VLS_24 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.addingSubtask = true;
                // @ts-ignore
                [addingSubtask,];
            } });
    /** @type {__VLS_StyleScopedClasses['act']} */ ;
    var __VLS_21;
    var __VLS_22;
    let __VLS_25;
    /** @ts-ignore @type {typeof __VLS_components.Button} */
    Button;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent1(__VLS_25, new __VLS_25({
        ...{ 'onClick': {} },
        icon: "pi pi-arrow-up-right",
        size: "small",
        text: true,
        severity: "secondary",
        ...{ class: "act" },
        'aria-label': "Open task",
    }));
    const __VLS_27 = __VLS_26({
        ...{ 'onClick': {} },
        icon: "pi pi-arrow-up-right",
        size: "small",
        text: true,
        severity: "secondary",
        ...{ class: "act" },
        'aria-label': "Open task",
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
    let __VLS_30;
    const __VLS_31 = ({ click: {} },
        { onClick: (__VLS_ctx.open) });
    /** @type {__VLS_StyleScopedClasses['act']} */ ;
    var __VLS_28;
    var __VLS_29;
    let __VLS_32;
    /** @ts-ignore @type {typeof __VLS_components.Button} */
    Button;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent1(__VLS_32, new __VLS_32({
        ...{ 'onClick': {} },
        icon: "pi pi-trash",
        size: "small",
        text: true,
        severity: "secondary",
        ...{ class: "act" },
        'aria-label': "Delete",
    }));
    const __VLS_34 = __VLS_33({
        ...{ 'onClick': {} },
        icon: "pi pi-trash",
        size: "small",
        text: true,
        severity: "secondary",
        ...{ class: "act" },
        'aria-label': "Delete",
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    let __VLS_37;
    const __VLS_38 = ({ click: {} },
        { onClick: (__VLS_ctx.remove) });
    /** @type {__VLS_StyleScopedClasses['act']} */ ;
    var __VLS_35;
    var __VLS_36;
    if (__VLS_ctx.expanded) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "children" },
        });
        /** @type {__VLS_StyleScopedClasses['children']} */ ;
        if (__VLS_ctx.addingSubtask) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
                ...{ class: "add-child" },
            });
            /** @type {__VLS_StyleScopedClasses['add-child']} */ ;
            let __VLS_39;
            /** @ts-ignore @type {typeof __VLS_components.InputText} */
            InputText;
            // @ts-ignore
            const __VLS_40 = __VLS_asFunctionalComponent1(__VLS_39, new __VLS_39({
                ...{ 'onKeydown': {} },
                ...{ 'onKeydown': {} },
                ...{ 'onBlur': {} },
                modelValue: (__VLS_ctx.subtaskTitle),
                placeholder: "Subtask title",
                size: "small",
                autofocus: true,
            }));
            const __VLS_41 = __VLS_40({
                ...{ 'onKeydown': {} },
                ...{ 'onKeydown': {} },
                ...{ 'onBlur': {} },
                modelValue: (__VLS_ctx.subtaskTitle),
                placeholder: "Subtask title",
                size: "small",
                autofocus: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_40));
            let __VLS_44;
            const __VLS_45 = ({ keydown: {} },
                { onKeydown: (__VLS_ctx.addSubtask) });
            const __VLS_46 = ({ keydown: {} },
                { onKeydown: (() => { __VLS_ctx.subtaskTitle = ''; __VLS_ctx.addingSubtask = false; }) });
            const __VLS_47 = ({ blur: {} },
                { onBlur: (__VLS_ctx.addSubtask) });
            var __VLS_42;
            var __VLS_43;
        }
        for (const [c] of __VLS_vFor((__VLS_ctx.children))) {
            let __VLS_48;
            /** @ts-ignore @type {typeof __VLS_components.TaskTreeNode} */
            TaskTreeNode;
            // @ts-ignore
            const __VLS_49 = __VLS_asFunctionalComponent1(__VLS_48, new __VLS_48({
                key: (c.id),
                task: (c),
                all: (__VLS_ctx.all),
            }));
            const __VLS_50 = __VLS_49({
                key: (c.id),
                task: (c),
                all: (__VLS_ctx.all),
            }, ...__VLS_functionalComponentArgsRest(__VLS_49));
            // @ts-ignore
            [children, expanded, addingSubtask, addingSubtask, open, remove, subtaskTitle, subtaskTitle, addSubtask, addSubtask, all,];
        }
    }
    // @ts-ignore
    [];
    return (await import('vue')).defineComponent({
        __typeProps: {},
    });
})();
