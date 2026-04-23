/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/template-helpers.d.ts" />
/// <reference types="../../../../../../../.npm/_npx/2db181330ea4b15b/node_modules/@vue/language-core/types/props-fallback.d.ts" />
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Timeline, DataSet } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import SelectButton from 'primevue/selectbutton';
import { useTasksStore } from '../../stores/tasks';
import { useListsStore } from '../../stores/lists';
import { priorityMeta, statusMeta } from '../../constants/tasks';
// Mode semantics: how many days fit in the viewport without scrolling.
const DAYS_IN_VIEW = {
    Week: 7,
    Month: 30,
    Quarter: 90,
    Year: 365,
};
const props = defineProps();
const tasksStore = useTasksStore();
const listsStore = useListsStore();
const router = useRouter();
const viewMode = ref('Week');
const viewModes = ['Week', 'Month', 'Quarter', 'Year'];
const DAY_MS = 24 * 60 * 60 * 1000;
const mount = ref(null);
let timeline = null;
let dataset = null;
let suppressNextSync = false;
let skipNextClick = false;
const visibleTasks = computed(() => tasksStore
    .getForList(props.listId)
    .filter(t => t.startDate && t.dueDate));
function toItem(t) {
    const s = statusMeta(t.status);
    const p = priorityMeta(t.priority);
    const done = t.status === 'done';
    const hasPriority = t.priority !== 'none';
    const fmt = (iso) => new Date(iso).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
    });
    // Tooltip (Shneiderman: details on demand) — shown by vis on hover.
    const title = [
        `<b>${escapeHtml(t.title)}</b>`,
        `${fmt(t.startDate)} → ${fmt(t.dueDate)}`,
        `Status: ${s.label}${hasPriority ? ` · Priority: ${p.label}` : ''}`,
    ].join('<br>');
    return {
        id: t.id,
        content: escapeHtml(t.title),
        start: new Date(t.startDate),
        end: new Date(t.dueDate),
        type: 'range',
        editable: { updateTime: true, updateGroup: false, remove: false },
        title,
        className: [
            'hule-bar',
            `hule-status-${t.status}`,
            hasPriority ? 'has-priority' : '',
            done ? 'is-done' : '',
        ].filter(Boolean).join(' '),
        style: [
            `--bar-color:${s.color}`,
            hasPriority ? `--priority-color:${p.color}` : '',
        ].filter(Boolean).join(';'),
    };
}
function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}
/** Window = exactly N days centered on `center`. */
function windowForMode(mode, center = new Date()) {
    const halfMs = (DAYS_IN_VIEW[mode] * DAY_MS) / 2;
    return {
        start: new Date(center.getTime() - halfMs),
        end: new Date(center.getTime() + halfMs),
    };
}
/** Pick a sensible initial center: today if any task overlaps the default week, else nearest-to-today task's start. */
function initialCenter(tasks, mode) {
    const now = Date.now();
    const halfMs = (DAYS_IN_VIEW[mode] * DAY_MS) / 2;
    const winStart = now - halfMs;
    const winEnd = now + halfMs;
    const overlaps = tasks.some(t => {
        const s = new Date(t.startDate).getTime();
        const e = new Date(t.dueDate).getTime();
        return e >= winStart && s <= winEnd;
    });
    if (overlaps || tasks.length === 0)
        return new Date();
    // No task near today — center on the closest task by start date.
    let nearest = tasks[0];
    let bestDist = Math.abs(new Date(nearest.startDate).getTime() - now);
    for (const t of tasks) {
        const d = Math.abs(new Date(t.startDate).getTime() - now);
        if (d < bestDist) {
            nearest = t;
            bestDist = d;
        }
    }
    return new Date(nearest.startDate);
}
function create() {
    if (!mount.value)
        return;
    dispose();
    dataset = new DataSet(visibleTasks.value.map(toItem));
    const center = initialCenter(visibleTasks.value, viewMode.value);
    const win = windowForMode(viewMode.value, center);
    const options = {
        height: '100%',
        editable: {
            updateTime: true,
            updateGroup: false,
            add: false,
            remove: false,
            overrideItems: true,
        },
        selectable: true,
        itemsAlwaysDraggable: { item: true, range: true },
        stack: true,
        // We render today as a full-day column highlight + custom marker at noon,
        // so the default (live-updating, midnight-based) current-time line is off.
        showCurrentTime: false,
        zoomable: true,
        horizontalScroll: true,
        verticalScroll: false,
        zoomKey: 'ctrlKey',
        moveable: true,
        // Drag/resize step = 1 day: round any mouse position to midnight.
        snap: (date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d;
        },
        margin: { item: 10, axis: 16 },
        orientation: { axis: 'top', item: 'top' },
        // Longest bars sit at the top of each stack — easier to read, less eye travel
        // to the dominant work item.
        order: (a, b) => durationMs(b) - durationMs(a),
        onMove: (item, callback) => {
            if (!item.id || !item.start || !item.end) {
                callback(null);
                return;
            }
            const start = toDate(item.start);
            const end = toDate(item.end);
            if (end.getTime() <= start.getTime()) {
                callback(null);
                return;
            }
            skipNextClick = true;
            suppressNextSync = true;
            tasksStore
                .update(String(item.id), {
                startDate: start.toISOString(),
                dueDate: end.toISOString(),
            })
                .then(() => callback(item))
                .catch((e) => {
                console.error('Failed to update dates', e);
                suppressNextSync = false;
                callback(null);
            });
        },
        start: win.start,
        end: win.end,
    };
    timeline = new Timeline(mount.value, dataset, options);
    // Custom "today" marker rendered at noon so the vertical line visually
    // bisects the day column (we operate in 1-day steps).
    timeline.addCustomTime(noonToday(), 'hule-today');
    timeline.on('click', (ev) => {
        if (skipNextClick) {
            skipNextClick = false;
            return;
        }
        if (ev.item == null)
            return;
        if (ev.what !== 'item')
            return;
        const list = listsStore.byId[props.listId];
        if (!list)
            return;
        void router.push({
            name: 'task',
            params: { spaceId: list.spaceId, listId: props.listId, taskId: String(ev.item) },
        });
    });
    requestAnimationFrame(() => { timeline?.redraw(); });
}
function syncData() {
    if (!dataset) {
        create();
        return;
    }
    const next = visibleTasks.value.map(toItem);
    const nextIds = new Set(next.map(i => String(i.id)));
    const currentIds = dataset.getIds().map(String);
    const toRemove = currentIds.filter(id => !nextIds.has(id));
    if (toRemove.length > 0)
        dataset.remove(toRemove);
    if (next.length > 0)
        dataset.update(next);
}
function dispose() {
    if (timeline) {
        timeline.destroy();
        timeline = null;
    }
    if (dataset) {
        dataset.clear();
        dataset = null;
    }
}
function toDate(v) {
    return v instanceof Date ? v : new Date(v);
}
function durationMs(item) {
    const s = item.start instanceof Date ? item.start.getTime() : new Date(item.start).getTime();
    const e = item.end instanceof Date ? item.end.getTime() : new Date((item.end ?? item.start)).getTime();
    return e - s;
}
function noonToday() {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
}
function applyViewMode(mode) {
    if (!timeline)
        return;
    const range = timeline.getWindow();
    const center = new Date((range.start.valueOf() + range.end.valueOf()) / 2);
    const { start, end } = windowForMode(mode, center);
    timeline.setWindow(start, end, { animation: false });
}
function goToday() {
    if (!timeline)
        return;
    const { start, end } = windowForMode(viewMode.value, new Date());
    timeline.setWindow(start, end, { animation: { duration: 200, easingFunction: 'easeInOutQuad' } });
}
function fitAll() {
    if (!timeline)
        return;
    timeline.fit({ animation: { duration: 200, easingFunction: 'easeInOutQuad' } });
}
onMounted(async () => {
    await tasksStore.loadForList(props.listId);
    create();
});
watch(() => props.listId, async (id) => {
    await tasksStore.loadForList(id);
    create();
});
watch(viewMode, mode => {
    if (!timeline)
        return;
    applyViewMode(mode);
    requestAnimationFrame(() => applyViewMode(mode));
});
watch(visibleTasks, () => {
    if (suppressNextSync) {
        suppressNextSync = false;
        return;
    }
    syncData();
});
onBeforeUnmount(dispose);
const __VLS_ctx = {
    ...{},
    ...{},
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['tb-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tb-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "timeline" },
});
/** @type {__VLS_StyleScopedClasses['timeline']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ...{ class: "toolbar" },
});
/** @type {__VLS_StyleScopedClasses['toolbar']} */ ;
let __VLS_0;
/** @ts-ignore @type {typeof __VLS_components.SelectButton} */
SelectButton;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
    modelValue: (__VLS_ctx.viewMode),
    options: (__VLS_ctx.viewModes),
    size: "small",
    allowEmpty: (false),
}));
const __VLS_2 = __VLS_1({
    modelValue: (__VLS_ctx.viewMode),
    options: (__VLS_ctx.viewModes),
    size: "small",
    allowEmpty: (false),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.goToday) },
    ...{ class: "tb-btn" },
});
/** @type {__VLS_StyleScopedClasses['tb-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.button, __VLS_intrinsics.button)({
    ...{ onClick: (__VLS_ctx.fitAll) },
    ...{ class: "tb-btn" },
    disabled: (__VLS_ctx.visibleTasks.length === 0),
});
/** @type {__VLS_StyleScopedClasses['tb-btn']} */ ;
__VLS_asFunctionalElement1(__VLS_intrinsics.span)({
    ...{ class: "tb-spacer" },
});
/** @type {__VLS_StyleScopedClasses['tb-spacer']} */ ;
if (__VLS_ctx.visibleTasks.length > 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.span, __VLS_intrinsics.span)({
        ...{ class: "muted small" },
    });
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
    /** @type {__VLS_StyleScopedClasses['small']} */ ;
    (__VLS_ctx.visibleTasks.length);
    (__VLS_ctx.visibleTasks.length === 1 ? 'task' : 'tasks');
}
if (__VLS_ctx.visibleTasks.length === 0) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "empty muted" },
    });
    /** @type {__VLS_StyleScopedClasses['empty']} */ ;
    /** @type {__VLS_StyleScopedClasses['muted']} */ ;
}
__VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
    ref: "mount",
    ...{ class: "vis-mount" },
});
/** @type {__VLS_StyleScopedClasses['vis-mount']} */ ;
// @ts-ignore
[viewMode, viewModes, goToday, fitAll, visibleTasks, visibleTasks, visibleTasks, visibleTasks, visibleTasks,];
const __VLS_export = (await import('vue')).defineComponent({
    __typeProps: {},
});
export default {};
