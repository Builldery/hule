/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { ref } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { useSpacesStore } from '../../stores/spaces';
import SpaceNode from './SpaceNode.vue';
const spacesStore = useSpacesStore();
const toast = useToast();
const adding = ref(false);
const newName = ref('');
async function submit() {
    const name = newName.value.trim();
    if (!name) {
        adding.value = false;
        return;
    }
    try {
        await spacesStore.create({ name });
        newName.value = '';
        adding.value = false;
    }
    catch (e) {
        toast.add({ severity: 'error', summary: 'Failed to create space', detail: String(e), life: 4000 });
    }
}
function cancel() {
    newName.value = '';
    adding.value = false;
}
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['sidebar-input']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar" },
});
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "sidebar-head" },
});
/** @type {__VLS_StyleScopedClasses['sidebar-head']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "brand" },
});
/** @type {__VLS_StyleScopedClasses['brand']} */ ;
if (!__VLS_ctx.adding) {
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.Button} */
    Button;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onClick': {} },
        icon: "pi pi-plus",
        size: "small",
        text: true,
        severity: "secondary",
        'aria-label': "Add space",
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onClick': {} },
        icon: "pi pi-plus",
        size: "small",
        text: true,
        severity: "secondary",
        'aria-label': "Add space",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ click: {} },
        { onClick: (...[$event]) => {
                if (!(!__VLS_ctx.adding))
                    return;
                __VLS_ctx.adding = true;
                // @ts-ignore
                [adding, adding,];
            } });
    var __VLS_3;
    var __VLS_4;
}
if (__VLS_ctx.adding) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sidebar-input" },
    });
    /** @type {__VLS_StyleScopedClasses['sidebar-input']} */ ;
    let __VLS_7;
    /** @ts-ignore @type {typeof __VLS_components.InputText} */
    InputText;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
        ...{ 'onKeydown': {} },
        ...{ 'onKeydown': {} },
        ...{ 'onBlur': {} },
        modelValue: (__VLS_ctx.newName),
        placeholder: "Space name",
        autofocus: true,
        size: "small",
    }));
    const __VLS_9 = __VLS_8({
        ...{ 'onKeydown': {} },
        ...{ 'onKeydown': {} },
        ...{ 'onBlur': {} },
        modelValue: (__VLS_ctx.newName),
        placeholder: "Space name",
        autofocus: true,
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    let __VLS_12;
    const __VLS_13 = ({ keydown: {} },
        { onKeydown: (__VLS_ctx.submit) });
    const __VLS_14 = ({ keydown: {} },
        { onKeydown: (__VLS_ctx.cancel) });
    const __VLS_15 = ({ blur: {} },
        { onBlur: (__VLS_ctx.submit) });
    var __VLS_10;
    var __VLS_11;
}
if (__VLS_ctx.spacesStore.loading && !__VLS_ctx.spacesStore.loaded) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sidebar-empty muted" },
    });
    /** @type {__VLS_StyleScopedClasses['sidebar-empty']} */ ;
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
}
else if (__VLS_ctx.spacesStore.items.length === 0 && !__VLS_ctx.adding) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "sidebar-empty muted" },
    });
    /** @type {__VLS_StyleScopedClasses['sidebar-empty']} */ ;
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
}
for (const [space] of __VLS_vFor((__VLS_ctx.spacesStore.items))) {
    const __VLS_16 = SpaceNode;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent1(__VLS_16, new __VLS_16({
        key: (space.id),
        space: (space),
    }));
    const __VLS_18 = __VLS_17({
        key: (space.id),
        space: (space),
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    // @ts-ignore
    [adding, adding, newName, submit, submit, cancel, spacesStore, spacesStore, spacesStore, spacesStore,];
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
