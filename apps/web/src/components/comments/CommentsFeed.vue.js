/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, watch } from 'vue';
import Button from 'primevue/button';
import { useCommentsStore } from '../../stores/comments';
import CommentComposer from './CommentComposer.vue';
const props = defineProps();
const commentsStore = useCommentsStore();
const items = computed(() => commentsStore.getForTask(props.taskId));
onMounted(() => { void commentsStore.loadForTask(props.taskId); });
watch(() => props.taskId, id => { void commentsStore.loadForTask(id); });
function formatDate(s) {
    const d = new Date(s);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
async function remove(id) {
    await commentsStore.remove(id, props.taskId);
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
/** @type {__VLS_StyleScopedClasses['comment']} */ ;
/** @type {__VLS_StyleScopedClasses['del']} */ ;
/** @type {__VLS_StyleScopedClasses['attachment']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "feed" },
});
/** @type {__VLS_StyleScopedClasses['feed']} */ ;
if (__VLS_ctx.items.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "muted empty" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['empty']} */ ;
}
for (const [c] of __VLS_vFor((__VLS_ctx.items))) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        key: (c.id),
        ...{ class: "comment" },
    });
    /** @type {__VLS_StyleScopedClasses['comment']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.header, __VLS_intrinsics.header)({
        ...{ class: "head" },
    });
    /** @type {__VLS_StyleScopedClasses['head']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "kind muted" },
    });
    /** @type {__VLS_StyleScopedClasses['kind']} */ ;
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    (c.kind === 'activity' ? '• activity' : 'Comment');
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "muted date" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['date']} */ ;
    (__VLS_ctx.formatDate(c.createdAt));
    let __VLS_0;
    /** @ts-ignore @type {typeof __VLS_components.Button} */
    Button;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
        ...{ 'onClick': {} },
        icon: "pi pi-trash",
        text: true,
        severity: "secondary",
        size: "small",
        ...{ class: "del" },
        'aria-label': "Delete comment",
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onClick': {} },
        icon: "pi pi-trash",
        text: true,
        severity: "secondary",
        size: "small",
        ...{ class: "del" },
        'aria-label': "Delete comment",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_5;
    const __VLS_6 = ({ click: {} },
        { onClick: (...[$event]) => {
                __VLS_ctx.remove(c.id);
                // @ts-ignore
                [items, items, formatDate, remove,];
            } });
    /** @type {__VLS_StyleScopedClasses['del']} */ ;
    var __VLS_3;
    var __VLS_4;
    if (c.body) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "body" },
        });
        /** @type {__VLS_StyleScopedClasses['body']} */ ;
        (c.body);
    }
    if (c.attachments.length > 0) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            ...{ class: "attachments" },
        });
        /** @type {__VLS_StyleScopedClasses['attachments']} */ ;
        for (const [a] of __VLS_vFor((c.attachments))) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.a, __VLS_intrinsics.a)({
                key: (a.fileId),
                href: (`/api/files/${a.fileId}`),
                target: "_blank",
                rel: "noopener",
                ...{ class: "attachment" },
            });
            /** @type {__VLS_StyleScopedClasses['attachment']} */ ;
            if (a.mime.startsWith('image/')) {
                __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                    src: (`/api/files/${a.fileId}`),
                    alt: (a.filename),
                });
            }
            else {
                __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                    ...{ class: "file-name" },
                });
                /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
                (a.filename);
            }
            // @ts-ignore
            [];
        }
    }
    // @ts-ignore
    [];
}
const __VLS_7 = CommentComposer;
// @ts-ignore
const __VLS_8 = __VLS_asFunctionalComponent1(__VLS_7, new __VLS_7({
    taskId: (props.taskId),
}));
const __VLS_9 = __VLS_8({
    taskId: (props.taskId),
}, ...__VLS_functionalComponentArgsRest(__VLS_8));
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
