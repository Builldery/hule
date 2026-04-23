import { http } from './client';
function qs(params) {
    const parts = [];
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined)
            continue;
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
    return parts.length ? `?${parts.join('&')}` : '';
}
export const tasksHttpRepo = {
    listByList: (listId, opts) => http(`/api/tasks${qs({ listId, includeSubtasks: opts?.includeSubtasks })}`),
    get: (id) => http(`/api/tasks/${id}`),
    getSubtree: (id) => http(`/api/tasks/${id}/subtree`),
    create: (dto) => http('/api/tasks', { method: 'POST', body: JSON.stringify(dto) }),
    update: (id, patch) => http(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    move: (id, dto) => http(`/api/tasks/${id}/move`, { method: 'POST', body: JSON.stringify(dto) }),
    remove: (id) => http(`/api/tasks/${id}`, { method: 'DELETE' }),
    timeline: (opts) => http(`/api/tasks/timeline${qs(opts)}`),
};
