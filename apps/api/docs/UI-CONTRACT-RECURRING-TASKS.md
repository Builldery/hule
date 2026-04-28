# UI Contract: Recurring Tasks & Actions

Hand-off для следующей сессии, которая делает UI в `apps/web` для recurring
задач и actions. Читай этот док + [RECURRING-TASKS.md](./RECURRING-TASKS.md)
(там архитектура и FAQ — это контракт).

---

## Mental model

Пользователь видит **«повторяющаяся задача»** — единая сущность. Под капотом
это:

- **TaskTemplate** — шаблон (что спавнить). Имеет дерево подзадач (`parentId`/`path`).
- **RecurringJob** — расписание (когда). Time-based: daily/weekly/monthly/yearly.
- **Action** — триггер на событие задачи. Используется для on-close.
- **Task** — обычная задача. Спавненные имеют `spawnedFromTemplateId`.

Маппинг четырёх «вариантов повторения» на бэк:

| UX вариант | Бэк |
|---|---|
| Каждый день | RecurringJob `kind='daily'` |
| Раз в неделю | RecurringJob `kind='weekly', weekday=N` |
| Раз в месяц | RecurringJob `kind='monthly', monthDay=N` |
| Раз в год | RecurringJob `kind='yearly', monthDay+monthOfYear` |
| Завтрашняя при закрытии текущей | Action `triggerEvent='task.after-update', condition='status changed-to done', effect='spawn-task-from-template'` |

Первые четыре делаются **одним POST** `/recurring-tasks`. Пятая — отдельный
flow (см. ниже «On-close recipe»).

---

## Auth и scoping

- Все endpoints под `/workspaces/:workspaceId/...`
- Bearer auth (тот же, что у Task'ов и прочих сущностей)
- В респонсах все ID — строки (ObjectId hex)
- Даты — ISO 8601 строки (`'2026-04-28T00:00:00.000Z'`)

---

## Endpoints

### TaskTemplate

```
GET    /workspaces/:wsId/task-templates?spaceId=...&includeSubtasks=false
GET    /workspaces/:wsId/task-templates/:id
GET    /workspaces/:wsId/task-templates/:id/subtree
POST   /workspaces/:wsId/task-templates
PATCH  /workspaces/:wsId/task-templates/:id
POST   /workspaces/:wsId/task-templates/:id/move
POST   /workspaces/:wsId/task-templates/:id/spawn      ← разовый спавн в Task
DELETE /workspaces/:wsId/task-templates/:id            ← блочится при наличии RecurringJob/Action ref
```

`TaskTemplateDto`:
```json
{
  "id": "...",
  "spaceId": "...",
  "parentId": null,
  "title": "Читать 10 страниц",
  "description": null,
  "priority": "none",
  "order": 0,
  "depth": 0,
  "path": [],
  "tagIds": [],
  "timeEstimate": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

`POST /task-templates`:
```json
{
  "spaceId": "...",            // required
  "parentId": null,            // optional, для подшаблона
  "title": "...",              // required, 1..500
  "description": "...",        // optional, до 20000
  "priority": "low|normal|high|urgent|none",  // optional
  "tagIds": ["..."],           // optional
  "timeEstimate": 60           // optional, минуты
}
```

`POST /task-templates/:id/spawn`:
```json
// Request
{
  "listId": "...",            // required — куда положить инстанс
  "startDate": "2026-04-28T00:00:00.000Z",  // optional
  "dueDate": "2026-04-28T23:59:59.999Z"     // optional
}
// Response: TaskDto (новая задача с spawnedFromTemplateId=templateId)
```

### RecurringTask (комбинированный create + CRUD)

```
GET    /workspaces/:wsId/recurring-tasks
GET    /workspaces/:wsId/recurring-tasks/:id
POST   /workspaces/:wsId/recurring-tasks               ← создаёт Template + Job атомарно
PATCH  /workspaces/:wsId/recurring-tasks/:id           ← update template/schedule/active/targetListId
DELETE /workspaces/:wsId/recurring-tasks/:id           ← удаляет job + template поддерево
```

`RecurringTaskDto`:
```json
{
  "id": "...",                 // = job._id
  "name": "Читать 10 страниц",
  "templateId": "...",         // ссылка на TaskTemplate (для редактирования подзадач)
  "targetListId": "...",
  "spaceId": "...",            // = templateSpaceId
  "template": {                // snapshot полей шаблона (root)
    "title": "...",
    "description": null,
    "priority": "none",
    "tagIds": [],
    "timeEstimate": null
  },
  "schedule": {
    "kind": "daily",
    "timeOfDay": "09:00",
    "weekday": null,
    "monthDay": null,
    "monthOfYear": null
  },
  "active": true,
  "nextRunAt": "2026-04-29T06:00:00.000Z",  // UTC — UI должен конвертировать в MSK для показа
  "lastRunAt": null,
  "lastSpawnedTaskId": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

`POST /recurring-tasks`:
```json
{
  "name": "Читать 10 страниц",         // required, 1..200
  "targetListId": "...",                // required
  "template": {
    "title": "Читать 10 страниц",
    "description": null,
    "priority": "normal",
    "tagIds": [],
    "timeEstimate": 30
  },
  "schedule": {
    "kind": "daily",                    // 'daily'|'weekly'|'monthly'|'yearly'
    "timeOfDay": "09:00",
    "weekday": null,                    // обяз. для weekly: 1=Пн..7=Вс
    "monthDay": null,                   // обяз. для monthly/yearly: 1..31
    "monthOfYear": null                 // обяз. для yearly: 1..12
  }
}
```

Schedule по варианту:
```json
// daily
{ "kind": "daily", "timeOfDay": "09:00" }

// weekly — каждый понедельник в 09:00
{ "kind": "weekly", "timeOfDay": "09:00", "weekday": 1 }

// monthly — 15-го числа каждого месяца
{ "kind": "monthly", "timeOfDay": "09:00", "monthDay": 15 }

// yearly — 1 января
{ "kind": "yearly", "timeOfDay": "09:00", "monthDay": 1, "monthOfYear": 1 }
```

`PATCH /recurring-tasks/:id` (всё опционально):
```json
{
  "name": "...",
  "active": false,                       // pause
  "targetListId": "...",
  "template": { "title": "...", ... },   // обновляет TaskTemplate root, не подзадачи
  "schedule": { ... }                    // полный schedule, не partial
}
```

⚠️ `schedule` в PATCH — это **полная замена**, не merge. Передавать все нужные
поля заново. После PATCH `nextRunAt` пересчитывается от текущего момента.

### Action

```
GET    /workspaces/:wsId/actions
GET    /workspaces/:wsId/actions/:id
POST   /workspaces/:wsId/actions
PATCH  /workspaces/:wsId/actions/:id
DELETE /workspaces/:wsId/actions/:id
```

`ActionDto`:
```json
{
  "id": "...",
  "name": "Next-day on close",
  "active": true,
  "skipOnBulk": true,
  "triggerEvent": "task.after-update",
  "triggerCondition": {
    "field": "status",
    "op": "changed-to",
    "value": "done"
  },
  "triggerScope": {
    "spaceId": null,
    "listId": null,
    "taskId": null,
    "templateId": "..."
  },
  "effectKind": "spawn-task-from-template",
  "effectParams": {
    "templateId": "...",
    "targetListId": "...",
    "daysOffset": 1
  },
  "createdAt": "...",
  "updatedAt": "..."
}
```

`POST /actions`:
```json
{
  "name": "Next-day on close",
  "active": true,                 // optional, default true
  "skipOnBulk": true,             // optional, default true (skip cascade-like contexts)
  "triggerEvent": "task.after-update",
  "triggerCondition": {           // optional, null = always fire
    "field": "status",
    "op": "changed-to",           // 'changed-to' | 'equals'
    "value": "done"
  },
  "triggerScope": {               // optional, любой null = no filter по этому полю
    "templateId": "..."
  },
  "effectKind": "spawn-task-from-template",
  "effectParams": {               // shape зависит от effectKind
    "templateId": "...",
    "targetListId": "...",        // optional — если null, использует listId изменённой задачи
    "daysOffset": 1               // optional, default 1
  }
}
```

---

## UX recipes

### Создать «каждый день в 09:00»

```ts
// 1. POST /workspaces/:wsId/recurring-tasks
{
  name: 'Читать 10 страниц',
  targetListId: currentListId,
  template: { title: 'Читать 10 страниц', priority: 'normal' },
  schedule: { kind: 'daily', timeOfDay: '09:00' }
}
// → возвращает RecurringTaskDto, в targetList'е появится первая задача в 09:00 MSK завтра
//   (или сегодня, если сейчас < 09:00)
```

### Создать «на завтра при закрытии»

Тут нужно **три шага**, потому что нет автоматического первого инстанса (нет
расписания). Пользователю надо стартовать цикл вручную.

```ts
// 1. Создать шаблон
const tpl = await fetch('/workspaces/:wsId/task-templates', {
  method: 'POST',
  body: JSON.stringify({
    spaceId, title: 'Полить цветы',
  })
});

// 2. Создать первый инстанс
const task = await fetch(`/workspaces/:wsId/task-templates/${tpl.id}/spawn`, {
  method: 'POST',
  body: JSON.stringify({
    listId: currentListId,
    startDate: today,
    dueDate: today,
  })
});

// 3. Action для on-close
await fetch('/workspaces/:wsId/actions', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Полить цветы — next day',
    triggerEvent: 'task.after-update',
    triggerCondition: { field: 'status', op: 'changed-to', value: 'done' },
    triggerScope: { templateId: tpl.id },
    effectKind: 'spawn-task-from-template',
    effectParams: { templateId: tpl.id, targetListId: currentListId, daysOffset: 1 }
  })
});
```

Когда пользователь закроет `task.id` (PATCH status='done'), бэк автоматически
спавнит следующую через day-offset.

> Можно проще обернуть в один UI-flow: «при создании on-close-задачи делать 3
> запроса последовательно». Если хочется атомарности — попроси меня в
> следующей сессии добавить combined endpoint `POST /recurring-tasks/on-close`
> или extend существующий с `kind: 'on-close-next-day'`.

### Pause / resume

```ts
PATCH /workspaces/:wsId/recurring-tasks/:id
{ active: false }
// или
{ active: true }
```

Для Action то же самое — `PATCH /actions/:id { active: false }`.

### Edit recurring task

```ts
PATCH /workspaces/:wsId/recurring-tasks/:id
{
  name: 'New name',
  template: { title: 'New title', priority: 'high' },     // полностью или partial
  schedule: { kind: 'weekly', timeOfDay: '10:00', weekday: 5 }  // ПОЛНОСТЬЮ
}
```

Подзадачи шаблона редактируются через `/task-templates/{templateId}` endpoints
(используя `templateId` из `RecurringTaskDto`).

### Список «у меня сейчас 3 повторяющиеся задачи»

```ts
GET /workspaces/:wsId/recurring-tasks
// → Array<RecurringTaskDto>, отсортирован по createdAt DESC
```

Показывать: `name`, `schedule` (форматировать как «Каждый день в 09:00» из
`kind`/`timeOfDay`/`weekday`/...), `active`, `nextRunAt` (в локальном MSK
формате), `lastRunAt`.

Для on-close actions — отдельный список:
```ts
GET /workspaces/:wsId/actions
// → Array<ActionDto>
// Filter UI'ем по effectKind='spawn-task-from-template' и triggerCondition.value='done'
// если хочется показать только «on-close recurring».
```

### Удалить

```ts
DELETE /workspaces/:wsId/recurring-tasks/:id
// → 204, сносит job + template + поддерево template'а
```

⚠️ Если удалить **TaskTemplate** напрямую (`DELETE /task-templates/:id`), а на
него есть RecurringJob или Action — придёт 400:

```json
{
  "error": "BadRequestException",
  "message": "Template is in use by a recurring task — delete the recurring task first"
}
```

UI должен отлавливать это и показывать пользователю осмысленное сообщение.

### Edit подзадач шаблона

```ts
// 1. Получить subtree
GET /workspaces/:wsId/task-templates/:templateRootId/subtree
// → Array<TaskTemplateDto>, root + descendants по depth/order

// 2. Добавить подзадачу
POST /workspaces/:wsId/task-templates
{ spaceId, parentId: templateRootId, title: '...' }

// 3. Обновить
PATCH /workspaces/:wsId/task-templates/:subtaskId
{ title: '...' }

// 4. Переместить
POST /workspaces/:wsId/task-templates/:subtaskId/move
{ parentId: '...', order: 0 }

// 5. Удалить
DELETE /workspaces/:wsId/task-templates/:subtaskId
```

При следующем спавне новая subtree-структура попадёт в инстанс. Прошлые
инстансы не трогаются.

---

## Status / state на UI

| Поле | Значения | Что показывать |
|---|---|---|
| `RecurringTask.active` | `true`/`false` | toggle / pause-icon |
| `RecurringTask.nextRunAt` | UTC ISO | "Следующий: завтра в 09:00" (форматить от MSK) |
| `RecurringTask.lastRunAt` | UTC ISO \| null | "Последний раз: вчера в 09:00" (или "Ни разу") |
| `RecurringTask.lastSpawnedTaskId` | string \| null | ссылка на последний инстанс (`GET /tasks/:id`) |
| `Action.active` | `true`/`false` | toggle |
| `Action.triggerScope.templateId` | string \| null | ссылка на шаблон |
| `Task.spawnedFromTemplateId` | string \| null | значок «из шаблона X» |

`nextRunAt` отображать в **локальном времени MSK**. На бэке всё в UTC, юзеру
показывай через `new Date(iso).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })`.

---

## Validation rules (для UI-валидации до отправки)

`schedule.timeOfDay`: regex `^([01]\d|2[0-3]):[0-5]\d$` (HH:MM 24h)
`schedule.weekday`: 1..7 (1=Пн, 7=Вс)
`schedule.monthDay`: 1..31 (UI: учти, что `monthDay=31` пропустит февраль)
`schedule.monthOfYear`: 1..12
`name`: 1..200 chars
`template.title`: 1..500 chars
`template.description`: до 20000 chars
`template.priority`: enum `'none'|'low'|'normal'|'high'|'urgent'`
`template.timeEstimate`: positive int (минуты)
`template.tagIds`: уникальные ObjectId

Action condition: `op` ∈ `'changed-to'|'equals'`. Поле `field` — любое поле
Task'и (`status`, `priority`, `assigneeId`, ...). Value — любой JSON.

---

## Error shape

Все ошибки в формате:
```json
{
  "error": "BadRequestException" | "NotFoundException" | "ValidationError",
  "message": "...",
  "issues": [...]   // только для ValidationError, см. ниже
}
```

Validation:
```json
{
  "error": "ValidationError",
  "issues": [
    { "path": ["schedule", "timeOfDay"], "message": "timeOfDay must be HH:MM (24h)" }
  ]
}
```

---

## Gotchas / подводные камни

1. **TZ**. На бэке хардкод `Europe/Moscow` (UTC+3, без DST). Юзер вводит
   `timeOfDay: '09:00'` — это 09:00 MSK. `nextRunAt` приходит в UTC (`06:00:00Z`).
   В UI всегда конвертируй обратно в MSK. Если юзер не в MSK — он увидит «09:00»
   при создании, потом в списке «09:00 MSK» (возможно непонятно). Если это
   проблема — вынести TZ в setting и попросить меня переписать `schedule-clock.ts`.

2. **monthDay edge cases**. `monthDay: 31` будет работать только в месяцах с
   31 днём (Jan/Mar/May/Jul/Aug/Oct/Dec). В остальных skipается. UI должен
   предупредить пользователя.

3. **Schedule в PATCH — full replacement**. Передавать всё, не partial. Если
   передал `{ kind: 'weekly' }` без `weekday` — валидатор отвергнет с
   ValidationError.

4. **Template subtasks не отображаются в RecurringTaskDto.template.** Snapshot
   только root. Чтобы увидеть подзадачи — `GET /task-templates/:templateId/subtree`.

5. **Action effects async.** После `PATCH /tasks/:id { status: 'done' }`
   ответ приходит мгновенно. Action отрабатывает фоном. Спавненная задача
   появится через ~50–500мс. UI должен либо опросить targetList повторно, либо
   подождать (или сделать optimistic placeholder).

6. **Timezone display**. Используй `Intl.DateTimeFormat`:
   ```ts
   new Intl.DateTimeFormat('ru-RU', {
     timeZone: 'Europe/Moscow',
     dateStyle: 'medium',
     timeStyle: 'short',
   }).format(new Date(nextRunAtISO));
   ```

7. **Удаление шаблона может упасть**. См. recipe «Удалить» выше. Всегда оборачивай
   `DELETE /task-templates/:id` в try/catch и показывай error.message.

8. **`spawnedFromTemplateId` — readonly.** Заполняется только при спавне,
   не присваивается через `POST /tasks` или `PATCH`. UI может только читать.

9. **Один шаблон → много recurring tasks.** Схема не запрещает несколько
   RecurringJob на один templateId. Если юзер создал «daily» и «weekly» из
   одного шаблона — будут спавниться оба независимо. UI: либо запретить (через
   проверку `existsForTemplate`), либо явно показать «этот шаблон используется
   в 2 расписаниях».

10. **`spaceId` шаблона** наследуется из `targetList.spaceId` при создании
    recurring task. Если в PATCH меняешь `targetListId` на список из другого
    спейса — `RecurringJob.spaceId` тоже меняется (см. service), а
    `TaskTemplate.spaceId` остаётся. Это, скорее всего, баг — флагни если
    важно.

---

## Open questions для UI разработчика

Когда придёшь делать UI, реши и спроси меня:

1. **Combined on-close endpoint** — UX сейчас 3-step (template + spawn + action).
   Хочется 1 запрос? Скажи — добавлю `POST /recurring-tasks/on-close` или
   расширю `kind` enum.

2. **Run-now / spawn-immediate** — для recurring task можно сделать «спавнить
   сейчас, не дожидаясь cron». Сейчас обходится через
   `POST /task-templates/:id/spawn`, но UX-неочевидно.

3. **List of «связанных recurring task'ов» для шаблона** — endpoint `GET
   /task-templates/:id/recurring-tasks` сейчас нет. Нужен?

4. **Pause/resume отдельные endpoints** — сейчас `PATCH active`. Если хотите
   отдельные `POST /:id/pause` + `/:id/resume` — тоже легко.

5. **Per-workspace TZ** — если будет нужно, скажи, перепишу `schedule-clock.ts`.

6. **Effect kinds beyond spawn-from-template** — какие ещё actions нужны?
   Notify через email/Telegram? Set-field (auto-assign при создании)?

7. **Show executed history** — Action не пишет лог исполнений. Если нужна
   история «когда и что фаирилось» — добавим коллекцию `action_executions`.

---

## Реализация на стороне UI: рекомендации

- Создать composables: `useRecurringTasks()`, `useTaskTemplates()`, `useActions()`.
- Кэшировать список через `RecurringTaskDto.spaceId` и invalidate'ить после
  PATCH/POST/DELETE.
- Опросы `nextRunAt` → пересчитывать «через сколько следующий запуск» каждые
  30 сек локально (без запросов).
- После закрытия on-close-задачи (`PATCH status: done`) — refetch targetList
  через ~500мс, чтобы увидеть spawn'енную следующую (см. gotcha 5).
- Для расписания weekly/monthly/yearly — UI выбора дня недели/числа должен
  переиспользоваться (одна и та же логика).
- Не забыть про i18n названий дней недели (`weekday: 1` = Пн).

---

## Контрольный чек-лист для UI сессии

- [ ] Список recurring tasks (страница «Мои повторяющиеся задачи»)
- [ ] Создание recurring task (модалка/форма с выбором kind, timeOfDay, target list)
- [ ] Карточка recurring task с next/last run, статусом, кнопками pause/edit/delete
- [ ] Редактирование (full PATCH с полем `schedule`)
- [ ] Управление подзадачами шаблона
- [ ] Список actions
- [ ] Создание on-close action (упрощённый flow «привязать к шаблону»)
- [ ] Бейджик «из шаблона X» на спавненных задачах (`spawnedFromTemplateId`)
- [ ] Обработка ошибки удаления шаблона при наличии refs
- [ ] TZ-форматирование `nextRunAt`/`lastRunAt`
