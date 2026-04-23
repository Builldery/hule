/// <reference types="../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import { useSpacesStore } from '../stores/spaces';
import { useListsStore } from '../stores/lists';
const props = defineProps();
const spacesStore = useSpacesStore();
const listsStore = useListsStore();
const router = useRouter();
const space = computed(() => spacesStore.byId[props.spaceId]);
const lists = computed(() => listsStore.getFor(props.spaceId));
onMounted(() => {
    void listsStore.loadForSpace(props.spaceId);
});
watch(() => props.spaceId, (id) => {
    void listsStore.loadForSpace(id);
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
if (!__VLS_ctx.space && __VLS_ctx.spacesStore.loaded) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "muted" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
}
else if (__VLS_ctx.space) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "space-view" },
    });
    /** @type {__VLS_StyleScopedClasses['space-view']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "page-head" },
    });
    /** @type {__VLS_StyleScopedClasses['page-head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    (__VLS_ctx.space.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.section, __VLS_intrinsics.section)({});
    __VLS_asFunctionalElement1(__VLS_intrinsics.h2, __VLS_intrinsics.h2)({});
    if (__VLS_ctx.lists.length === 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "muted" },
        });
        /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    }
    __VLS_asFunctionalElement1(__VLS_intrinsics.ul, __VLS_intrinsics.ul)({
        ...{ class: "list-grid" },
    });
    /** @type {__VLS_StyleScopedClasses['list-grid']} */ ;
    for (const [l] of __VLS_vFor((__VLS_ctx.lists))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.li, __VLS_intrinsics.li)({
            key: (l.id),
        });
        let __VLS_0;
        /** @ts-ignore @type {typeof __VLS_components.Button} */
        Button;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            ...{ 'onClick': {} },
            label: (l.name),
            text: true,
            severity: "secondary",
            icon: "pi pi-list",
        }));
        const __VLS_2 = __VLS_1({
            ...{ 'onClick': {} },
            label: (l.name),
            text: true,
            severity: "secondary",
            icon: "pi pi-list",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        let __VLS_5;
        const __VLS_6 = ({ click: {} },
            { onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.space && __VLS_ctx.spacesStore.loaded))
                        return;
                    if (!(__VLS_ctx.space))
                        return;
                    __VLS_ctx.router.push({ name: 'list', params: { spaceId: props.spaceId, listId: l.id } });
                    // @ts-ignore
                    [space, space, space, spacesStore, lists, lists, router,];
                } });
        var __VLS_3;
        var __VLS_4;
        // @ts-ignore
        [];
    }
}
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
