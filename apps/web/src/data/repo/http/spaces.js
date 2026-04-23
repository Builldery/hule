import { http } from './client';
export const spacesHttpRepo = {
    list: () => http('/api/spaces'),
    create: (dto) => http('/api/spaces', { method: 'POST', body: JSON.stringify(dto) }),
    update: (id, patch) => http(`/api/spaces/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    remove: (id) => http(`/api/spaces/${id}`, { method: 'DELETE' }),
    reorder: (items) => http('/api/spaces/reorder', { method: 'POST', body: JSON.stringify(items) }),
};
