# Повторяющиеся задачи и Action engine

Документация по фиче «recurring tasks»: модель, архитектура, решения, FAQ.
Дополняет [ARCHITECTURE.md](./ARCHITECTURE.md), не заменяет его. Читать после.

---

## 1. TL;DR

Пользователь хочет «задача каждый день в 09:00» или «задача на завтра, когда
текущая закрыта». Решение — две независимые сущности под капотом + единый UI:

- **TaskTemplate** — отдельная коллекция, шаблон задачи (с поддеревом подзадач).
- **RecurringJob** — расписание (cron-like), которое раз в минуту опрашивает
  планировщик и при наступлении `nextRunAt` спавнит инстанс из шаблона.
- **Action** — no-code триггер: «когда событие X на задаче с условием Y, выполни
  эффект Z». Используется для on-close-семантики.
- **TaskCopy** — фундамент: builder + стадии, копирующий Task ИЛИ TaskTemplate
  → Task с поддеревом, перенумерацией id, переустановкой полей.

Time-based recurrence (daily/weekly/monthly/yearly) → RecurringJob.
On-close recurrence → Action с эффектом `spawn-task-from-template`.
Любая «копия задачи» в будущем → тот же TaskCopy.

---

## 2. Карта сущностей

```
                       ┌──────────────────┐
                       │   TaskTemplate   │
                       │ (отд. коллекция, │
                       │   path/parentId) │
                       └────────┬─────────┘
            ┌───────────────────┼──────────────────┐
            │                                      │
            ▼                                      ▼
   ┌──────────────────┐                 ┌──────────────────┐
   │  RecurringJob    │                 │     Action       │
   │ kind: daily/.../ │                 │ triggerEvent +   │
   │ nextRunAt        │                 │ scope.templateId │
   │ targetListId     │                 │ effect:          │
   │   ↓ spawns       │                 │ spawn-task-from- │
   └────────┬─────────┘                 │ template         │
            │                           └────────┬─────────┘
            │                                    │
            │ TaskCopy (template → task)         │ TaskCopy (template → task)
            │ • status='todo'                    │ • status='todo'
            │ • startDate=today / dueDate=today  │ • startDate=tomorrow / dueDate=tomorrow
            │ • spawnedFromTemplateId=tplId      │ • spawnedFromTemplateId=tplId
            ▼                                    ▼
   ┌──────────────────────────────────────────────────────┐
   │                       Task                           │
   │ (со spawnedFromTemplateId, индексировано)            │
   └──────────────────────────────────────────────────────┘
                    ▲
                    │ post('findOneAndUpdate') middleware
                    │ ↓
            ┌───────┴────────┐
            │ taskEventsBus  │ in-process EventEmitter
            │ task.after-    │ payload { workspaceId, before, after, isBulk }
            │ update         │
            └───────┬────────┘
                    │
                    ▼
            ┌────────────────┐
            │ ActionEngine   │ matches scope + condition,
            │ Service        │ resolves effect, executes
            └────────────────┘
```

Ключевые поля:

- `Task.spawnedFromTemplateId` — заполняется TaskCopy, когда source = template.
  По нему скопится action с `triggerScope.templateId`.
- `RecurringJob.templateId` → TaskTemplate; защищает шаблон от удаления.
- `Action.triggerScope.templateId` → TaskTemplate; то же.
- `RecurringJob.nextRunAt` — UTC Date, индексирован вместе с `active`.

---

## 3. Файловая карта (новое в шагах 1–4)

```
adapters/mongo/
├── task.schema.ts                ← + spawnedFromTemplateId, + middleware (pre/post findOneAndUpdate)
├── task-template.schema.ts       ← новая
├── recurring-job.schema.ts       ← новая
├── action.schema.ts              ← новая (Action + ActionScope + ActionCondition subdocs)
├── task-events.bus.ts            ← глобальный EventEmitter
└── dispatch-context.ts           ← AsyncLocalStorage runBulk()/isBulk()

domain/entity/
├── task-template/                ← create/update/move/list/spawn DTOs
├── recurring-job/                ← schedule + create/update/read DTOs, ERecurrenceKind
└── action/                       ← create/update/read DTOs, EActionEvent/Op/EffectKind

domain/modules/
├── task-copy/
│   ├── task-copy.service.ts      ← фасад
│   ├── task-copy.builder.ts      ← fluent
│   ├── task-copy.types.ts        ← SourceNode, CopyOptions, PlannedTask, CopyPlan
│   ├── loaders/
│   │   ├── source-loader.interface.ts
│   │   ├── task-source.loader.ts
│   │   └── task-template-source.loader.ts
│   └── stages/
│       ├── remap-ids.stage.ts
│       ├── transform.stage.ts
│       └── persist.stage.ts
├── task-template/
│   └── task-template.service.ts  ← CRUD + spawnAsTask + защиты от удаления
├── recurring-job/
│   ├── recurring-job.service.ts  ← CRUD + tickDue + atomic claim
│   └── schedule-clock.ts         ← computeNextRunAt + localStartOfDay/EndOfDay
└── action/
    ├── action.service.ts         ← CRUD + cascades
    ├── action-engine.service.ts  ← подписан на bus, dispatch
    └── effects/
        ├── effect.interface.ts
        ├── spawn-task-from-template.effect.ts
        └── effects-registry.service.ts

adapters/rest-api/
├── task-template/                ← /workspaces/:wsId/task-templates (CRUD + /:id/move + /:id/spawn)
├── recurring-task/               ← /workspaces/:wsId/recurring-tasks (CRUD)
└── action/                       ← /workspaces/:wsId/actions (CRUD)

adapters/scheduler/
├── scheduler.module.ts           ← ScheduleModule.forRoot() + RecurringJobModule
└── recurring-jobs.scheduler.ts   ← @Cron(EVERY_MINUTE)
```

---

## 4. TaskCopy: builder + stages

Алгоритм копирования отделён от того, **что** копируем. Билдер собирает
`CopyOptions`, сервис прогоняет через стадии:

1. **`SourceLoader`** (один на тип источника) — Task-документы или
   TaskTemplate-документы → `SourceTree` (нормализованное представление с
   `nodes[]` и `comments[]`).
2. **`RemapIdsStage`** — каждому `sourceId` генерит новый ObjectId, кладёт в
   `idMap: Map<sourceHex, newOid>`.
3. **`TransformStage`** — для каждого `SourceNode` строит `PlannedTask`:
   - `parentId` = `idMap[node.parentSourceId]` (или `targetParentId` для root)
   - `path` = `[...targetParentPath, newRootId, ...interiorMappedIds]`
   - `depth` = `path.length`
   - применяет `setStatus`/`setDates`/`resetTrackedTime`/`resetAssignee`
   - выставляет `spawnedFromTemplateId` если опция `spawnedFromTemplateRootId` стоит
4. **`PersistStage`** — если `rootOrder` не указан, делает `findOne` по
   `(workspaceId, listId, parentId)` отсортированный по order → `+1`. Затем
   `insertMany(plannedTasks)` и `insertMany(plannedComments)`.

Использование:

```ts
// Из RecurringJobService.spawnInstance
await taskCopyService.builder()
  .fromTemplate(job.templateId)
  .inWorkspace(job.workspaceId)
  .toList(job.targetListId)
  .asChildOf(null)
  .withSubtasks()
  .withoutComments()
  .resetStatus('todo')
  .setDates({ startDate: today, dueDate: today })
  .execute();

// Из SpawnTaskFromTemplateEffect
.fromTemplate(params.templateId)
.toList(targetListId)
.setDates({ startDate: tomorrow, dueDate: tomorrow })

// Из POST /task-templates/:id/spawn
.fromTemplate(tplOid)
.toList(dto.listId)
// setDates только если переданы
```

`.fromTemplate()` автоматически выставляет `spawnedFromTemplateRootId =
templateRootId`. Транзакций нет, как и по всему API. Cross-workspace копия
не поддерживается (loader фильтрует по `targetWorkspaceId`, чужой source даст
`NotFoundException`).

---

## 5. TaskTemplate

**Отдельная коллекция** со своей иерархией (`parentId`, `path`, `depth`,
`order`). Не Task с флагом — чище для запросов и UI.

Поля шаблона **сознательно урезаны** относительно Task'а. Нет:
- `status` — у инстанса всегда задаётся при спавне (`'todo'`)
- `startDate` / `dueDate` — задаёт RecurringJob (today) или Action (tomorrow + N)
- `assigneeId` — пока не реализовано (можно добавить, когда понадобится)
- `trackedTime` — у каждого инстанса своё
- `listId` — задаёт RecurringJob/Action/`POST /spawn` через `targetListId`

**spaceId** — единственный «контейнер» для шаблона, для UI/организации.

**Move** работает 1:1 как у Task: смена `parentId` или `spaceId`, при пересборке
`path` каскадно правит потомков через `bulkWrite`.

**Защита от удаления:**
```ts
async delete(wsId, id) {
  // 1. Найти ВСЕ id поддерева (root + descendants)
  // 2. Проверить, что нет RecurringJob.templateId ∈ subtreeIds
  // 3. Проверить, что нет Action.triggerScope.templateId ∈ subtreeIds
  // 4. Если оба чисто — deleteMany по path
}
```
Пользователь должен сначала удалить связанные RecurringJob/Action.
В каскаде (Workspace/Space delete) проверка пропускается — там жобы и actions
чистятся ДО шаблонов.

`spawnAsTask(wsId, templateId, { listId, startDate?, dueDate? })` — ручной спавн
без расписания. Используется UI «использовать шаблон один раз» и для тестов
on-close без ожидания cron-минуты.

---

## 6. RecurringJob + Scheduler

### Schema

```ts
RecurringJob {
  workspaceId, spaceId, templateId, targetListId
  name                                  // 'Читать 10 страниц'
  kind: 'daily'|'weekly'|'monthly'|'yearly'
  timeOfDay: 'HH:MM'                    // в Europe/Moscow
  weekday?: 1..7                        // ISO, Mon=1..Sun=7 (только для weekly)
  monthDay?: 1..31                      // только для monthly/yearly
  monthOfYear?: 1..12                   // только для yearly
  active: boolean
  nextRunAt: Date                       // UTC, индексирован
  lastRunAt: Date | null
  lastSpawnedTaskId: ObjectId | null
}
```

Индекс: `{ active: 1, nextRunAt: 1 }`.

### Атомарный claim (защита от дублей)

Раз в минуту `RecurringJobsScheduler.tick()` зовёт `tickDue()`:

```ts
while (true) {
  const due = await jobModel.findOne({ active: true, nextRunAt: { $lte: now } });
  if (!due) break;

  const claimed = await jobModel.findOneAndUpdate(
    { _id: due._id, nextRunAt: due.nextRunAt, active: true },  // ← compare-and-swap
    { $set: { nextRunAt: <computedNext>, lastRunAt: now } },
    { new: true },
  );
  if (!claimed) continue;  // забрал кто-то другой

  await spawnInstance(claimed, now);
}
```

Только успешный CAS-апдейт спавнит. Если несколько процессов API одновременно
тикают — один заберёт, остальные получат `null` от `findOneAndUpdate` и пройдут
мимо. Дубли исключены без транзакций.

### Время и таймзона

Захардкожен `Europe/Moscow` (= `Europe/Minsk`, оба UTC+3, без DST). Реализация в
[`schedule-clock.ts`](../src/domain/modules/recurring-job/schedule-clock.ts):

```ts
const TZ_OFFSET_MS = 3 * 60 * 60 * 1000;
toLocal(d) = d + 3h         // UTC → "локальное время как UTC"
localToUtc(d) = d - 3h       // обратно
```

`computeNextRunAt(spec, after)` возвращает UTC `Date`, в который следующий раз
сработать. Логика:
- **daily**: сегодня в `timeOfDay` если ещё не прошло, иначе завтра.
- **weekly**: ближайший день недели (1=Пн..7=Вс).
- **monthly**: ближайший `monthDay`. Если в месяце такого дня нет (Feb 30) —
  переходит к следующему месяцу. Семантика: «каждый 31-й» фактически работает
  только в месяцах с 31 днём.
- **yearly**: ближайший `monthDay` в `monthOfYear`. 29 февраля сдвинется на
  следующий високосный год.

`localStartOfDay(d)` / `localEndOfDay(d)` — для расстановки `startDate`/`dueDate`
у спавненной задачи (00:00 / 23:59:59.999 в MSK, конвертированы в UTC).

### Расположение

`adapters/scheduler/` — отдельный «адаптер», параллельный rest-api. Cron
работает в том же процессе, что и REST API (импортируется в `RestApiModule`).
Если когда-нибудь захотим вынести scheduler в отдельный контейнер — создадим
`apps/scheduler.app.ts` и второй entry-point.

---

## 7. Action engine

### Event flow

```
TaskService.update
   └─ taskModel.findOneAndUpdate(...)
          ├─ pre('findOneAndUpdate'): _beforeDoc = await model.findOne(query).lean()
          └─ post('findOneAndUpdate'): taskEventsBus.emit('task.after-update', {
               workspaceId, before: _beforeDoc, after: doc.toObject(), isBulk: isBulk()
             })

ActionEngineService.onModuleInit
   └─ taskEventsBus.on('task.after-update', e => handleTaskAfterUpdate(e).catch(log))

handleTaskAfterUpdate
   ├─ find Action[] by { workspaceId, active: true, triggerEvent: 'task.after-update' }
   ├─ for each action:
   │    ├─ if action.skipOnBulk && e.isBulk → continue
   │    ├─ matchesScope(action, e.after)?            // spaceId/listId/taskId/templateId
   │    ├─ matchesCondition(action, e.before, e.after)?  // changed-to / equals
   │    ├─ effect = effectsRegistry.resolve(action.effectKind)
   │    └─ effect.execute(payload, action.effectParams)   // fire-and-forget, ошибки в Logger
```

### Schema

```ts
Action {
  workspaceId
  name
  active: boolean
  skipOnBulk: boolean       // default true

  triggerEvent: 'task.after-update'
  triggerCondition: { field, op: 'changed-to'|'equals', value } | null
  triggerScope: { spaceId?, listId?, taskId?, templateId? }   // null любого = no filter

  effectKind: 'spawn-task-from-template'
  effectParams: { templateId, targetListId?, daysOffset? }
}
```

### `skipOnBulk` и `runBulk()`

`AsyncLocalStorage` хранит флаг `bulk: true`. Code paths, которые делают
массовые операции (`SpaceService.delete`, `WorkspaceService.delete`), оборачивают
тело в `runBulk(async () => { ... })`. Mongoose middleware читает `isBulk()` и
кладёт в payload. Engine пропускает actions со `skipOnBulk: true`.

На сегодня **ни один из текущих хуков не вылезает из cascade** — потому что
cascade пути используют `deleteMany`/`bulkWrite`, а не `findOneAndUpdate`.
Инфраструктура готова на будущее (например, если добавим `task.after-delete`
через хуки `deleteMany` — там это уже сработает).

### Effects

`IActionEffect`:
```ts
interface IActionEffect {
  readonly kind: EActionEffectKind;
  execute(payload: ActionEventPayload, params: Record<string, unknown>): Promise<void>;
}
```

Сейчас один эффект — `SpawnTaskFromTemplateEffect`:
```ts
params: { templateId, targetListId?, daysOffset? }
```
Если `targetListId` не задан — берёт `listId` исходной задачи (т.е. спавнит в тот
же список). `daysOffset` (default 1) — на сколько дней вперёд от сегодня.

Регистрация эффектов — `EffectsRegistryService` с `Map<kind, effect>`. Чтобы
добавить новый — реализовать `IActionEffect`, зарегистрировать в registry и в
`ActionModule.providers`.

### Async semantics

Effect.execute идёт **фоном**: `dispatch().catch(log)`. HTTP-ответ пользователю
улетает до завершения effect'а. Это намеренно — если spawn падает, мы не ломаем
изначальный update запрос.

---

## 8. Каскадное удаление

```
SpaceService.delete(wsId, id):
  runBulk(async () => {
    const lists = await listModel.find({ spaceId, workspaceId });
    actionService.deleteBySpaceId(wsOid, oid)        // 1. actions сначала
    recurringJobService.deleteBySpaceId(wsOid, oid)  // 2. jobs
    spaceModel.deleteOne(...)                         // 3. сам space
    listService.deleteBySpaceId(wsOid, oid, listIds) // 4. lists → tasks → comments
    taskTemplateService.deleteBySpaceId(wsOid, oid)  // 5. templates (после jobs/actions)
  })

WorkspaceService.delete:
  runBulk:
    actionService.deleteByWorkspaceId
    recurringJobService.deleteByWorkspaceId
    spaceService.deleteByWorkspaceId    ← каскад дальше
    fileService.deleteByWorkspaceId
    tagService.deleteByWorkspaceId
    workspaceModel.deleteOne
```

Порядок важен: actions/jobs ссылаются на templates → удаляются ДО шаблонов.
Защита `templateModel.delete` не срабатывает в каскаде, так что race нет.

---

## 9. Decision log

| Решение | Выбор | Альтернатива | Почему |
|---|---|---|---|
| Recurrence модель | TaskTemplate (отдельная коллекция) | Цепочка через `recurrenceSourceId` | Цепочки нарушаются пользователем (удалил, закрыл вручную). Шаблон стабилен. |
| Шаблон vs Task с флагом | Отдельная коллекция | Task с `isTemplate: true` | Не нужен фильтр в каждом запросе листинга. Поля шаблона осознанно урезаны (нет status/dates/assignee/trackedTime). |
| Где scheduler | `adapters/scheduler/` в том же процессе | Отдельный `apps/scheduler.app.ts` | Сначала проще, легче дебажить. Выделим если упрёмся в нагрузку. |
| Тик планировщика | Каждую минуту | Каждые 5 минут | timeOfDay у пользователя точный (например, 09:30) — минута лучше. Запрос дешёвый (один индекс). |
| Защита от дублей | Atomic CAS findOneAndUpdate | Транзакции / распределённый lock | Не требует replica set / лишней инфры. Достаточно для MVP. |
| Таймзона | Hardcode Europe/Moscow (UTC+3) | Per-user / per-workspace TZ | MVP с одним пользователем в одном TZ. Без DST в MSK. Заменить на date-fns-tz позже. |
| Триггеры actions | Schema-level mongoose middleware + EventEmitter | Service-driven dispatch | Гарантия покрытия — schema не может «забыть» эмитнуть. Позже легко добавить новые хуки. |
| Detection bulk | AsyncLocalStorage `runBulk()` | Опция в query | AsyncLocalStorage устанавливается один раз в начале каскада, никакого пробрасывания через слои. |
| Action effects | Registry с DI | switch-case в engine | Легко добавлять новые эффекты, не трогая engine. |
| One/two endpoints для recurring task | Один комбинированный + raw для template | Только два low-level | UX: пользователь думает «recurring task», а не «template + job». Низкоуровневые `/task-templates` всё ещё доступны для редактирования подзадач. |
| skipOnBulk default | `true` | `false` | Большинство actions хотят user-initiated changes, не cascade. Лучше явно opt-in для cascade. |
| Async effect.execute | fire-and-forget с .catch(log) | await в request lifecycle | Если spawn падает, не ломаем изначальный update. Видно в логах. |
| Удаление шаблона при наличии job/action | Block с 400 | Cascade delete | Безопасность данных. Пользователь должен удалить связанный recurring task / action явно. |

---

## 10. API surface

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/workspaces/:wsId/task-templates?spaceId=&includeSubtasks=` | Список шаблонов в спейсе |
| GET | `/workspaces/:wsId/task-templates/:id` | Один шаблон |
| GET | `/workspaces/:wsId/task-templates/:id/subtree` | Поддерево |
| POST | `/workspaces/:wsId/task-templates` | Создать шаблон / подшаблон |
| PATCH | `/workspaces/:wsId/task-templates/:id` | Обновить (title/desc/priority/tags/timeEstimate) |
| POST | `/workspaces/:wsId/task-templates/:id/move` | Сменить parent/space, переставить order |
| POST | `/workspaces/:wsId/task-templates/:id/spawn` | Создать Task из шаблона разово |
| DELETE | `/workspaces/:wsId/task-templates/:id` | Удалить (защищён ссылками от RecurringJob/Action) |
| GET | `/workspaces/:wsId/recurring-tasks` | Список повторяющихся задач |
| GET | `/workspaces/:wsId/recurring-tasks/:id` | Одна |
| POST | `/workspaces/:wsId/recurring-tasks` | Создать (template + job атомарно) |
| PATCH | `/workspaces/:wsId/recurring-tasks/:id` | Обновить (template и/или schedule, active, targetListId) |
| DELETE | `/workspaces/:wsId/recurring-tasks/:id` | Удалить (job + template + поддерево) |
| GET | `/workspaces/:wsId/actions` | Список actions |
| GET | `/workspaces/:wsId/actions/:id` | Один |
| POST | `/workspaces/:wsId/actions` | Создать action |
| PATCH | `/workspaces/:wsId/actions/:id` | Обновить |
| DELETE | `/workspaces/:wsId/actions/:id` | Удалить |

Все scoped по workspace через `@CurrentWorkspaceId()` decorator. Bearer auth.

---

## 11. FAQ

**Q: Что произойдёт, если изменить расписание у работающей recurring task?**
A: `PATCH /recurring-tasks/:id { schedule: {...} }` пересчитает `nextRunAt` от
`new Date()` через `computeNextRunAt`. То есть следующий спавн будет по новому
расписанию от текущего момента.

**Q: А если поставить `active: false`?**
A: `nextRunAt` остаётся прежним. `claimNextDue` фильтрует по `active: true`,
поэтому job просто игнорируется. Снова `active: true` — тикнет в свой
`nextRunAt`. Если это «прошлое», тикнет немедленно.

**Q: Что если пропустили несколько `nextRunAt` (например, downtime сервиса)?**
A: При следующем тике `claimNextDue` найдёт job с `nextRunAt <= now`, спавнет
один инстанс, переставит `nextRunAt` на следующий по расписанию. Пропущенные
итерации не догоняются — сделать «один спавн = одна итерация» проще, чем
батчевую догонку.

**Q: Можно ли иметь несколько RecurringJob на один шаблон?**
A: Да, схема не запрещает. Защита от удаления шаблона проверяет любой ref →
все надо удалить. Use case: один шаблон, два разных расписания.

**Q: Можно ли on-close action на любую задачу, не привязанную к шаблону?**
A: Можно, через `triggerScope.taskId` (конкретная задача) или `listId`/`spaceId`
(все задачи в списке/спейсе). `templateId` — это просто один из способов скоупа.

**Q: Что произойдёт, если effect.execute упадёт?**
A: Ошибка попадёт в `Logger.error`, продолжится исполнение. Encore: HTTP-ответ
изначального update'а уже улетел пользователю — он не узнает об ошибке. Если
важно атомарно — нужно переписать на await + propagate, но это меняет UX (медленнее).

**Q: Что если две гонки на одно событие (effect создаёт task, который снова триггерит)?**
A: Effect создаёт **новую** задачу (insertMany). У новой нет `before` (не было),
update event на ней не fires (insertMany не дёргает findOneAndUpdate-хук).
Цикла нет. Обратное направление (update на новой задаче → action) сработает,
но это нормальная семантика «когда пользователь её закроет».

**Q: TZ — как сменить?**
A: Hardcoded `TZ_OFFSET_MS = 3 * 60 * 60 * 1000` в
[`schedule-clock.ts`](../src/domain/modules/recurring-job/schedule-clock.ts).
Если нужен реальный DST — заменить utility на date-fns-tz, всё остальное не
поменяется.

**Q: TaskCopy с комментариями — почему withComments=false по умолчанию?**
A: Для рекуррентного спавна это не нужно. Атачменты при `withComments=true`
вырезаются (массив `[]`) — если нужны атачменты, надо ещё реализовать клон в
GridFS/R2 (сейчас не сделано).

**Q: Как заpause'ить ВСЕ recurring tasks (например, на ночь)?**
A: Endpoint'а нет. Можно: `await jobModel.updateMany({}, { $set: { active: false } })`
вручную в Mongo. Фича запросится — добавим.

**Q: `spawnedFromTemplateId` остаётся вечно? Что, если шаблон удалён?**
A: Сейчас защита блокирует удаление шаблона при ref'ах. Поэтому удалённого
шаблона быть не может. Если в будущем разрешим cascade — поле станет dangling,
но это не сломает Task'у.

**Q: Можно ли изменять шаблон после создания recurring task?**
A: Да, через `PATCH /recurring-tasks/:id { template: {...} }` или напрямую
`PATCH /task-templates/:id`. Следующий спавн возьмёт обновлённые поля.
Прошлые инстансы не меняются.

**Q: Как добавить новый эффект (например, отправить уведомление)?**
A:
1. Добавить значение в `EActionEffectKind` enum.
2. Реализовать класс `class NotifyEffect implements IActionEffect`.
3. Зарегистрировать в `EffectsRegistryService` constructor.
4. Зарегистрировать в `ActionModule.providers`.
5. Описать схему `effectParams` (валидируется в DTO лишь как `Record<string, unknown>` —
   эффект сам проверяет).

**Q: Как добавить новый event (например, `task.after-create`)?**
A:
1. Добавить значение в `EActionEvent`.
2. В `task.schema.ts` добавить `post('save', ...)` или `post('insertMany', ...)`
   middleware, эмит в `taskEventsBus.emit('task.after-create', payload)`.
3. В `ActionEngineService.onModuleInit` подписаться: `bus.on('task.after-create', ...)`.
4. Сделать `handleTaskAfterCreate` (логика похожа на update, но без `before`).

**Q: Можно ли скопировать (duplicate) обычную задачу с подзадачами через TaskCopy?**
A: Технически да — `taskCopyService.builder().fromTask(taskId).toList(listId).execute()`.
REST endpoint'а сейчас нет. Если понадобится — добавится в 1-2 строки в
TaskController.

---

## 12. Что не сделано / future work

- **gridfs `as any`** в `gridfs.service.ts:35` — наследие bump'а `mongodb` driver
  до 7.x при `pnpm install @nestjs/schedule`. `contentType` убрали из
  `GridFSBucketWriteStreamOptions` top-level. Behavior identical, нужен
  cleanup-PR (перенос `contentType` в `metadata`).
- **TZ хардкод** — Europe/Moscow only. Если будут пользователи в других зонах,
  переписать `schedule-clock.ts` через `date-fns-tz` или `Intl.DateTimeFormat`.
- **Pause/resume endpoints** — сейчас только через `PATCH active`. Возможно
  стоит сделать `POST /:id/pause` + `POST /:id/resume` для UX.
- **«Run now»** для recurring task — отдельный endpoint, который форсит
  немедленный спавн без ожидания cron'а.
- **Notification effects** — на будущее, когда появится email/Telegram.
- **Cross-workspace копирование** — сейчас явно запрещено (loader-level).
- **Distributed scheduler** — если поднимем несколько API-инстансов, atomic CAS
  работает, но если scheduler выделим в отдельные контейнеры с горизонтальным
  scaling — нужно подумать о coordination (или rely на CAS, что и так норм).
- **Идемпотентность effect** — нет guard'а от повторного исполнения. Сейчас не
  нужно (in-process bus, единственный listener), но при переходе на распределённую
  шину (Kafka/Rabbit) понадобится.
- **Тесты** — по архитектурному принципу проекта тестов нет. Если будут
  прибавляться, в первую очередь нужны unit-тесты на `schedule-clock.ts`
  (граничные случаи: 31 февраля, 29 февраля високосного года, переходы через
  год) и на `transform.stage.ts` (path remapping).
