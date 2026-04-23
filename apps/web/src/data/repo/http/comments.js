import { http } from './client';
export const commentsHttpRepo = {
    listForTask: (taskId) => http(`/api/tasks/${taskId}/comments`),
    create: (taskId, dto) => {
        const fd = new FormData();
        if (dto.body)
            fd.append('body', dto.body);
        for (const f of dto.files ?? [])
            fd.append('files', f, f.name);
        return http(`/api/tasks/${taskId}/comments`, { method: 'POST', body: fd });
    },
    remove: (id) => http(`/api/comments/${id}`, { method: 'DELETE' }),
};
