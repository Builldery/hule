import { http } from './client';
export const listsHttpRepo = {
    listBySpace: (spaceId) => http(`/api/lists?spaceId=${encodeURIComponent(spaceId)}`),
    create: (dto) => http('/api/lists', { method: 'POST', body: JSON.stringify(dto) }),
    update: (id, patch) => http(`/api/lists/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    remove: (id) => http(`/api/lists/${id}`, { method: 'DELETE' }),
    reorder: (items) => http('/api/lists/reorder', { method: 'POST', body: JSON.stringify(items) }),
};
