/// <reference types="../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useSpacesStore } from '../stores/spaces';
const spacesStore = useSpacesStore();
const router = useRouter();
const first = computed(() => spacesStore.items[0]);
watchEffect(() => {
    if (spacesStore.loaded && first.value) {
        void router.replace({ name: 'space', params: { spaceId: first.value.id } });
    }
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "empty-state" },
});
/** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
if (!__VLS_ctx.spacesStore.loaded) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "muted" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
}
else if (__VLS_ctx.spacesStore.items.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "muted" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.p, __VLS_intrinsics.p)({
        ...{ class: "muted" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    (__VLS_ctx.first?.name);
}
// @ts-ignore
[spacesStore, spacesStore, first,];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
