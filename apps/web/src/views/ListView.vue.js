/// <reference types="../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SelectButton from 'primevue/selectbutton';
import { useListsStore } from '../stores/lists';
import { useSpacesStore } from '../stores/spaces';
import TaskListMode from '../components/task/TaskListMode.vue';
import KanbanBoard from '../components/kanban/KanbanBoard.vue';
import GanttView from '../components/timeline/GanttView.vue';
const MODES = ['list', 'kanban', 'timeline'];
const props = defineProps();
const route = useRoute();
const router = useRouter();
const spacesStore = useSpacesStore();
const listsStore = useListsStore();
const list = computed(() => listsStore.byId[props.listId]);
const space = computed(() => spacesStore.byId[props.spaceId]);
function parseMode(v) {
    return typeof v === 'string' && MODES.includes(v)
        ? v
        : 'list';
}
const mode = computed({
    get: () => parseMode(route.query.view),
    set: (v) => {
        const query = { ...route.query, view: v === 'list' ? undefined : v };
        void router.replace({ name: 'list', params: route.params, query });
    },
});
const modes = [
    { label: 'List', value: 'list', icon: 'pi pi-list' },
    { label: 'Kanban', value: 'kanban', icon: 'pi pi-table' },
    { label: 'Timeline', value: 'timeline', icon: 'pi pi-calendar' },
];
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
/** @type {__VLS_StyleScopedClasses['mode-body']} */ ;
/** @type {__VLS_StyleScopedClasses['mode-body']} */ ;
if (__VLS_ctx.list) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "list-view" },
        ...{ class: ('mode-' + __VLS_ctx.mode) },
    });
    /** @type {__VLS_StyleScopedClasses['list-view']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "page-head" },
    });
    /** @type {__VLS_StyleScopedClasses['page-head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "breadcrumb muted" },
    });
    /** @type {__VLS_StyleScopedClasses['breadcrumb']} */ ;
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    (__VLS_ctx.space?.name);
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "row spaced" },
    });
    /** @type {__VLS_StyleScopedClasses['row']} */ ;
    /** @type {__VLS_StyleScopedClasses['spaced']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.h1, __VLS_intrinsics.h1)({});
    (__VLS_ctx.list.name);
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.SelectButton} */
    SelectButton;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        modelValue: (__VLS_ctx.mode),
        options: (__VLS_ctx.modes),
        optionLabel: "label",
        optionValue: "value",
        size: "small",
        allowEmpty: (false),
    }));
    const __VLS_2 = __VLS_1({
        modelValue: (__VLS_ctx.mode),
        options: (__VLS_ctx.modes),
        optionLabel: "label",
        optionValue: "value",
        size: "small",
        allowEmpty: (false),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mode-body" },
    });
    /** @type {__VLS_StyleScopedClasses['mode-body']} */ ;
    if (__VLS_ctx.mode === 'list') {
        const __VLS_5 = TaskListMode;
        // @ts-ignore
        const __VLS_6 = __VLS_asFunctionalComponent1(__VLS_5, new __VLS_5({
            listId: (props.listId),
        }));
        const __VLS_7 = __VLS_6({
            listId: (props.listId),
        }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    }
    else if (__VLS_ctx.mode === 'kanban') {
        const __VLS_10 = KanbanBoard;
        // @ts-ignore
        const __VLS_11 = __VLS_asFunctionalComponent1(__VLS_10, new __VLS_10({
            listId: (props.listId),
        }));
        const __VLS_12 = __VLS_11({
            listId: (props.listId),
        }, ...__VLS_functionalComponentArgsRest(__VLS_11));
    }
    else if (__VLS_ctx.mode === 'timeline') {
        const __VLS_15 = GanttView;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent1(__VLS_15, new __VLS_15({
            listId: (props.listId),
        }));
        const __VLS_17 = __VLS_16({
            listId: (props.listId),
        }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    }
}
else if (__VLS_ctx.listsStore.getFor(props.spaceId).length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "muted" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
}
else {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "muted" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
}
// @ts-ignore
[list, list, mode, mode, mode, mode, mode, space, modes, listsStore,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
