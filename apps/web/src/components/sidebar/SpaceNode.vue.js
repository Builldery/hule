/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useSpacesStore } from '../../stores/spaces';
import { useListsStore } from '../../stores/lists';
const props = defineProps();
const route = useRoute();
const router = useRouter();
const spacesStore = useSpacesStore();
const listsStore = useListsStore();
const confirm = useConfirm();
const toast = useToast();
const expanded = ref(true);
const addingList = ref(false);
const newListName = ref('');
const editingName = ref(false);
const nameDraft = ref(props.space.name);
watch(() => props.space.name, v => { nameDraft.value = v; });
watch(expanded, (v) => {
    if (v)
        void listsStore.loadForSpace(props.space.id);
}, { immediate: true });
async function saveName() {
    const trimmed = nameDraft.value.trim();
    if (!trimmed || trimmed === props.space.name) {
        nameDraft.value = props.space.name;
        editingName.value = false;
        return;
    }
    try {
        await spacesStore.update(props.space.id, { name: trimmed });
        editingName.value = false;
    }
    catch (e) {
        toast.add({ severity: 'error', summary: 'Rename failed', detail: String(e), life: 4000 });
    }
}
function confirmDelete(e) {
    confirm.require({
        target: e.currentTarget,
        message: `Delete space "${props.space.name}" and all its lists/tasks?`,
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await spacesStore.remove(props.space.id);
                if (route.params.spaceId === props.space.id) {
                    await router.push({ name: 'home' });
                }
            }
            catch (err) {
                toast.add({ severity: 'error', summary: 'Delete failed', detail: String(err), life: 4000 });
            }
        },
    });
}
async function submitNewList() {
    const name = newListName.value.trim();
    if (!name) {
        addingList.value = false;
        return;
    }
    try {
        const list = await listsStore.create({ spaceId: props.space.id, name });
        newListName.value = '';
        addingList.value = false;
        await router.push({ name: 'list', params: { spaceId: props.space.id, listId: list.id } });
    }
    catch (e) {
        toast.add({ severity: 'error', summary: 'Failed to create list', detail: String(e), life: 4000 });
    }
}
function cancelNewList() {
    newListName.value = '';
    addingList.value = false;
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
/** @type {__VLS_StyleScopedClasses['space-row']} */ ;
/** @type {__VLS_StyleScopedClasses['space-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['space-name']} */ ;
/** @type {__VLS_StyleScopedClasses['list-row']} */ ;
/** @type {__VLS_StyleScopedClasses['list-row']} */ ;
/** @type {__VLS_StyleScopedClasses['list-row']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-node" },
});
/** @type {__VLS_StyleScopedClasses['space-node']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-row" },
});
/** @type {__VLS_StyleScopedClasses['space-row']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.Button} */
Button;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    icon: (__VLS_ctx.expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'),
    size: "small",
    text: true,
    severity: "secondary",
    ...{ class: "chev" },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    icon: (__VLS_ctx.expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'),
    size: "small",
    text: true,
    severity: "secondary",
    ...{ class: "chev" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.expanded = !__VLS_ctx.expanded;
            // @ts-ignore
            [expanded, expanded, expanded,];
        } });
/** @type {__VLS_StyleScopedClasses['chev']} */ ;
var __VLS_3;
var __VLS_4;
if (__VLS_ctx.editingName) {
    let __VLS_7;
    /** @ts-ignore @type {typeof __VLS_components.InputText} */
    InputText;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ 'onKeydown': {} },
        ...{ 'onKeydown': {} },
        ...{ 'onBlur': {} },
        modelValue: (__VLS_ctx.nameDraft),
        size: "small",
        autofocus: true,
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onKeydown': {} },
        ...{ 'onKeydown': {} },
        ...{ 'onBlur': {} },
        modelValue: (__VLS_ctx.nameDraft),
        size: "small",
        autofocus: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_12;
    const __VLS_13 = ({ keydown: {} },
        { onKeydown: (__VLS_ctx.saveName) });
    const __VLS_14 = ({ keydown: {} },
        { onKeydown: (() => { __VLS_ctx.nameDraft = props.space.name; __VLS_ctx.editingName = false; }) });
    const __VLS_15 = ({ blur: {} },
        { onBlur: (__VLS_ctx.saveName) });
    var __VLS_10;
    var __VLS_11;
}
else {
    let __VLS_16;
    /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
    routerLink;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
        ...{ 'onDblclick': {} },
        ...{ class: "space-name" },
        to: ({ name: 'space', params: { spaceId: props.space.id } }),
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onDblclick': {} },
        ...{ class: "space-name" },
        to: ({ name: 'space', params: { spaceId: props.space.id } }),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_21;
    const __VLS_22 = ({ dblclick: {} },
        { onDblclick: (...[$event]) => {
                if (!!(__VLS_ctx.editingName))
                    return;
                __VLS_ctx.editingName = true;
                // @ts-ignore
                [editingName, editingName, editingName, nameDraft, nameDraft, saveName, saveName,];
            } });
    /** @type {__VLS_StyleScopedClasses['space-name']} */ ;
    const { default: __VLS_23 } = __VLS_19.slots;
    (props.space.name);
    // @ts-ignore
    [];
    var __VLS_19;
    var __VLS_20;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "space-actions" },
});
/** @type {__VLS_StyleScopedClasses['space-actions']} */ ;
let __VLS_24;
/** @ts-ignore @type {typeof __VLS_components.Button} */
Button;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent1(__VLS_24, new __VLS_24({
    ...{ 'onClick': {} },
    icon: "pi pi-plus",
    size: "small",
    text: true,
    severity: "secondary",
    'aria-label': "Add list",
}));
const __VLS_26 = __VLS_25({
    ...{ 'onClick': {} },
    icon: "pi pi-plus",
    size: "small",
    text: true,
    severity: "secondary",
    'aria-label': "Add list",
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_29;
const __VLS_30 = ({ click: {} },
    { onClick: (...[$event]) => {
            __VLS_ctx.addingList = true;
            __VLS_ctx.expanded = true;
            // @ts-ignore
            [expanded, addingList,];
        } });
var __VLS_27;
var __VLS_28;
let __VLS_31;
/** @ts-ignore @type {typeof __VLS_components.Button} */
Button;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent1(__VLS_31, new __VLS_31({
    ...{ 'onClick': {} },
    icon: "pi pi-trash",
    size: "small",
    text: true,
    severity: "secondary",
    'aria-label': "Delete space",
}));
const __VLS_33 = __VLS_32({
    ...{ 'onClick': {} },
    icon: "pi pi-trash",
    size: "small",
    text: true,
    severity: "secondary",
    'aria-label': "Delete space",
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
let __VLS_36;
const __VLS_37 = ({ click: {} },
    { onClick: (__VLS_ctx.confirmDelete) });
var __VLS_34;
var __VLS_35;
if (__VLS_ctx.expanded) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-children" },
    });
    /** @type {__VLS_StyleScopedClasses['space-children']} */ ;
    for (const [list] of __VLS_vFor((__VLS_ctx.listsStore.getFor(props.space.id)))) {
        let __VLS_38;
        /** @ts-ignore @type {typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink | typeof __VLS_components.routerLink | typeof __VLS_components.RouterLink} */
        routerLink;
        // @ts-ignore
        const __VLS_39 = __VLS_asFunctionalComponent1(__VLS_38, new __VLS_38({
            key: (list.id),
            ...{ class: "list-row" },
            to: ({ name: 'list', params: { spaceId: props.space.id, listId: list.id } }),
            activeClass: "active",
        }));
        const __VLS_40 = __VLS_39({
            key: (list.id),
            ...{ class: "list-row" },
            to: ({ name: 'list', params: { spaceId: props.space.id, listId: list.id } }),
            activeClass: "active",
        }, ...__VLS_functionalComponentArgsRest(__VLS_39));
        /** @type {__VLS_StyleScopedClasses['list-row']} */ ;
        const { default: __VLS_43 } = __VLS_41.slots;
        __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
            ...{ class: "pi pi-list" },
        });
        /** @type {__VLS_StyleScopedClasses['pi']} */ ;
        /** @type {__VLS_StyleScopedClasses['pi-list']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
            ...{ class: "list-name" },
        });
        /** @type {__VLS_StyleScopedClasses['list-name']} */ ;
        (list.name);
        // @ts-ignore
        [expanded, confirmDelete, listsStore,];
        var __VLS_41;
        // @ts-ignore
        [];
    }
    if (__VLS_ctx.addingList) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "list-row add-list" },
        });
        /** @type {__VLS_StyleScopedClasses['list-row']} */ ;
        /** @type {__VLS_StyleScopedClasses['add-list']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
            ...{ class: "pi pi-list muted" },
        });
        /** @type {__VLS_StyleScopedClasses['pi']} */ ;
        /** @type {__VLS_StyleScopedClasses['pi-list']} */ ;
        /** @type {__VLS_StyleScopedClasses['muted']} */ ;
        let __VLS_44;
        /** @ts-ignore @type {typeof __VLS_components.InputText} */
        InputText;
        // @ts-ignore
        const __VLS_45 = __VLS_asFunctionalComponent1(__VLS_44, new __VLS_44({
            ...{ 'onKeydown': {} },
            ...{ 'onKeydown': {} },
            ...{ 'onBlur': {} },
            modelValue: (__VLS_ctx.newListName),
            size: "small",
            placeholder: "List name",
            autofocus: true,
        }));
        const __VLS_46 = __VLS_45({
            ...{ 'onKeydown': {} },
            ...{ 'onKeydown': {} },
            ...{ 'onBlur': {} },
            modelValue: (__VLS_ctx.newListName),
            size: "small",
            placeholder: "List name",
            autofocus: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_45));
        let __VLS_49;
        const __VLS_50 = ({ keydown: {} },
            { onKeydown: (__VLS_ctx.submitNewList) });
        const __VLS_51 = ({ keydown: {} },
            { onKeydown: (__VLS_ctx.cancelNewList) });
        const __VLS_52 = ({ blur: {} },
            { onBlur: (__VLS_ctx.submitNewList) });
        var __VLS_47;
        var __VLS_48;
    }
}
// @ts-ignore
[addingList, newListName, submitNewList, submitNewList, cancelNewList,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
