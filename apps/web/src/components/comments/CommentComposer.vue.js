/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, ref } from 'vue';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import { useDropZone } from '@vueuse/core';
import { useCommentsStore } from '../../stores/comments';
const props = defineProps();
const commentsStore = useCommentsStore();
const body = ref('');
const files = ref([]);
const dropEl = ref(null);
const submitting = ref(false);
const previews = computed(() => files.value.map((f) => ({
    name: f.name,
    size: f.size,
    url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
})));
function onPaste(e) {
    const items = e.clipboardData?.items;
    if (!items)
        return;
    const added = [];
    for (const it of items) {
        if (it.kind === 'file') {
            const f = it.getAsFile();
            if (f)
                added.push(f);
        }
    }
    if (added.length > 0) {
        files.value = [...files.value, ...added];
        e.preventDefault();
    }
}
useDropZone(dropEl, {
    onDrop: (dropped) => {
        if (dropped)
            files.value = [...files.value, ...dropped];
    },
    dataTypes: (types) => types.some((t) => t.startsWith('image/') || t === 'Files'),
});
function removeFile(i) {
    files.value = files.value.filter((_, idx) => idx !== i);
}
async function submit() {
    const text = body.value.trim();
    if (!text && files.value.length === 0)
        return;
    submitting.value = true;
    try {
        await commentsStore.create(props.taskId, { body: text || undefined, files: files.value });
        body.value = '';
        files.value = [];
    }
    finally {
        submitting.value = false;
    }
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
/** @type {__VLS_StyleScopedClasses['textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['preview']} */ ;
/** @type {__VLS_StyleScopedClasses['rm']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ref: "dropEl",
    ...{ class: "composer" },
});
/** @type {__VLS_StyleScopedClasses['composer']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.Textarea} */
Textarea;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    ...{ 'onPaste': {} },
    ...{ 'onKeydown': {} },
    ...{ 'onKeydown': {} },
    modelValue: (__VLS_ctx.body),
    placeholder: "Write a comment… (paste or drop images, Ctrl/Cmd+Enter to submit)",
    autoResize: true,
    rows: "2",
    ...{ class: "textarea" },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onPaste': {} },
    ...{ 'onKeydown': {} },
    ...{ 'onKeydown': {} },
    modelValue: (__VLS_ctx.body),
    placeholder: "Write a comment… (paste or drop images, Ctrl/Cmd+Enter to submit)",
    autoResize: true,
    rows: "2",
    ...{ class: "textarea" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_5;
const __VLS_6 = ({ paste: {} },
    { onPaste: (__VLS_ctx.onPaste) });
const __VLS_7 = ({ keydown: {} },
    { onKeydown: (__VLS_ctx.submit) });
const __VLS_8 = ({ keydown: {} },
    { onKeydown: (__VLS_ctx.submit) });
/** @type {__VLS_StyleScopedClasses['textarea']} */ ;
var __VLS_3;
var __VLS_4;
if (__VLS_ctx.previews.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "previews" },
    });
    /** @type {__VLS_StyleScopedClasses['previews']} */ ;
    for (const [p, i] of __VLS_vFor((__VLS_ctx.previews))) {
        __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
            key: (i),
            ...{ class: "preview" },
        });
        /** @type {__VLS_StyleScopedClasses['preview']} */ ;
        if (p.url) {
            __VLS_asFunctionalElement1(__VLS_intrinsics.img)({
                src: (p.url),
                alt: "",
            });
        }
        else {
            __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
                ...{ class: "file-name" },
            });
            /** @type {__VLS_StyleScopedClasses['file-name']} */ ;
            (p.name);
        }
        __VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.previews.length > 0))
                        return;
                    __VLS_ctx.removeFile(i);
                    // @ts-ignore
                    [body, onPaste, submit, submit, previews, previews, removeFile,];
                } },
            ...{ class: "rm" },
            'aria-label': "Remove",
        });
        /** @type {__VLS_StyleScopedClasses['rm']} */ ;
        __VLS_asFunctionalElement1(__VLS_intrinsics.i, __VLS_intrinsics.i)({
            ...{ class: "pi pi-times" },
        });
        /** @type {__VLS_StyleScopedClasses['pi']} */ ;
        /** @type {__VLS_StyleScopedClasses['pi-times']} */ ;
        // @ts-ignore
        [];
    }
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "actions" },
});
/** @type {__VLS_StyleScopedClasses['actions']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
    ...{ class: "muted hint" },
});
/** @type {__VLS_StyleScopedClasses['muted']} */ ;
/** @type {__VLS_StyleScopedClasses['hint']} */ ;
let __VLS_9;
/** @ts-ignore @type {typeof __VLS_components.Button} */
Button;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent1(__VLS_9, new __VLS_9({
    ...{ 'onClick': {} },
    label: "Comment",
    size: "small",
    disabled: (__VLS_ctx.submitting || (!__VLS_ctx.body.trim() && __VLS_ctx.files.length === 0)),
}));
const __VLS_11 = __VLS_10({
    ...{ 'onClick': {} },
    label: "Comment",
    size: "small",
    disabled: (__VLS_ctx.submitting || (!__VLS_ctx.body.trim() && __VLS_ctx.files.length === 0)),
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
let __VLS_14;
const __VLS_15 = ({ click: {} },
    { onClick: (__VLS_ctx.submit) });
var __VLS_12;
var __VLS_13;
// @ts-ignore
[body, submit, submitting, files,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
