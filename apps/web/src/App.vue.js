/// <reference types="../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { onMounted } from 'vue';
import AppSidebar from './components/sidebar/AppSidebar.vue';
import { useSpacesStore } from './stores/spaces';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
const spacesStore = useSpacesStore();
onMounted(() => {
    void spacesStore.load();
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "app-layout" },
});
/** @type {__VLS_StyleScopedClasses['app-layout']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.aside, __VLS_intrinsics.aside)({
    ...{ class: "app-sidebar" },
});
/** @type {__VLS_StyleScopedClasses['app-sidebar']} */ ;
const __VLS_0 = AppSidebar;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement1(__VLS_intrinsics.main, __VLS_intrinsics.main)({
    ...{ class: "app-main" },
});
/** @type {__VLS_StyleScopedClasses['app-main']} */ ;
let __VLS_5;
/** @ts-ignore @type {typeof __VLS_components.routerView | typeof __VLS_components.RouterView} */
routerView;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
let __VLS_10;
/** @ts-ignore @type {typeof __VLS_components.Toast} */
Toast;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({}));
const __VLS_12 = __VLS_11({}, ...__VLS_functionalComponentArgsRest(__VLS_11));
let __VLS_15;
/** @ts-ignore @type {typeof __VLS_components.ConfirmDialog} */
ConfirmDialog;
// @ts-ignore
const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({}));
const __VLS_17 = __VLS_16({}, ...__VLS_functionalComponentArgsRest(__VLS_16));
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
