# Tags & Time Tracking — контракты для web

> Самодостаточная дока для интеграции на web. Читай холодно: кто/что/как,
> без оглядки на историю обсуждения. Описан _только_ свежий функционал
> (теги, оценка времени, учтённое время) + обязательный контекст, без
> которого контракт не соберёшь (auth, base path, формат ошибок).

---

## 0. TL;DR

Добавили в backend:

1. **Tag** — отдельная сущность, scoped к workspace. Поля: `name`, `color`
   (enum из 6 цветов). Уникальность `(workspaceId, name)`. Полный CRUD
   под `/api/workspaces/:workspaceId/tags`.
2. **Task.tagIds** — `string[]` (id тегов). Теги множественные,
   один тег — на многих тасках. При удалении тега он сам вытаскивается
   `$pull` из `tagIds` всех тасков воркспейса.
3. **Task.timeEstimate** — `number | undefined`, **минуты**. UI сам
   решает, как отрисовать (часы/минуты).
4. **Task.trackedTime** — `number | undefined`, **минуты**. Пользователь
   заполняет руками. UI отрисовывает.

Все три поля поддерживаются в `POST /tasks` и `PATCH /tasks/:id`. В
`PATCH` для `timeEstimate`/`trackedTime` значение `null` сбрасывает
поле (`$unset`). Массив `tagIds` в `PATCH` **полностью заменяет**
текущий — не патчится per-element.

---

## 1. Базовое (нужно, чтобы собрать любой запрос)

### 1.1 Base URL + auth

- Все пути начинаются с `/api`.
- Все ресурсы (кроме `/auth/*` и `/health`) — workspace-scoped.
  Префикс: `/api/workspaces/:workspaceId/...`.
- Авторизация — JWT Bearer: `Authorization: Bearer <token>`.
  Токен выдаёт `/api/auth/login`.
- `:workspaceId` в пути валидируется guard'ом: если юзер не member
  воркспейса → 403.

### 1.2 Формат ответов

- JSON, `content-type: application/json`.
- Успех: `200` (или `201`/`204` где уместно). Сейчас в контроллерах
  не расставлены `@HttpCode(201)` на create — по умолчанию 200. Не
  закладывайся на 201, принимай любой 2xx.
- `204` без тела (DELETE, move).
- Даты — ISO-строки (`createdAt`, `updatedAt`, `startDate`, `dueDate`).

### 1.3 Формат ошибок

Глобальный фильтр оборачивает `HttpException` в:

```json
{ "error": "BadRequestException", "message": "..." }
```

Исключение — валидация DTO:

```json
{
  "error": "ValidationError",
  "issues": [
    { "path": ["name"], "message": "name should not be empty" }
  ]
}
```

`statusCode` лежит в HTTP-статусе ответа. `HttpError.body` в
`httpClient.ts` (apps/web/src/app/api/httpClient.ts) даст эти поля
целиком — по `body.error === 'ValidationError'` отличай
валидацию от домена.

### 1.4 Коды, с которыми столкнёшься

| Код | Когда                                                                    |
|-----|--------------------------------------------------------------------------|
| 400 | `ValidationError`; домен-инвариант (`tag не из этого workspace` и т.п.) |
| 401 | Нет/битый Bearer                                                         |
| 403 | `WorkspaceAccessGuard` (не member), редактирование чужого                |
| 404 | `Tag not found`, `Task not found`                                        |
| 409 | Дубликат `(workspaceId, name)` при создании/переименовании тега          |

---

## 2. Tag API

Корень: `/api/workspaces/:workspaceId/tags`.

### 2.1 Схема DTO

```ts
// Read
interface TagDto {
  id: string
  name: string          // 1..40 chars
  color: TagColor       // enum, см. §4
  createdAt: string     // ISO
  updatedAt: string     // ISO
}

// Create
interface CreateTagDto {
  name: string          // required, 1..40
  color?: TagColor      // default 'gray'
}

// Update (PATCH — частичный)
interface UpdateTagDto {
  name?: string         // 1..40
  color?: TagColor
}

type TagColor = 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'purple'
```

### 2.2 Эндпоинты

| Метод  | Путь                                              | Тело           | Ответ        |
|--------|---------------------------------------------------|----------------|--------------|
| GET    | `/api/workspaces/:wsId/tags`                      | —              | `TagDto[]` отсортировано по `name` asc |
| GET    | `/api/workspaces/:wsId/tags/:id`                  | —              | `TagDto`     |
| POST   | `/api/workspaces/:wsId/tags`                      | `CreateTagDto` | `TagDto`     |
| PATCH  | `/api/workspaces/:wsId/tags/:id`                  | `UpdateTagDto` | `TagDto`     |
| DELETE | `/api/workspaces/:wsId/tags/:id`                  | —              | `204` (без тела) |

### 2.3 Правила

- **Уникальность имени в рамках workspace.** Попытка создать/переименовать
  в занятое имя → `409 Conflict`, `message: "Tag with this name already exists"`.
  `name` сравнивается как есть (case-sensitive). Если нужно
  case-insensitive — договариваемся отдельно, backend пока не нормализует.
- **Удаление тега → $pull из всех тасков воркспейса.** Одной операцией
  `updateMany`. Фронту после успешного DELETE нужно локально убрать
  `tagId` из `task.tagIds` у всех задач в кэше (см. §5.3).
- **Цвет — enum, 6 значений.** Любое другое → 400 `ValidationError`.

### 2.4 Примеры

```bash
# list
curl -H "Authorization: Bearer $T" \
  https://host/api/workspaces/$WS/tags

# create
curl -X POST -H "Authorization: Bearer $T" -H "content-type: application/json" \
  -d '{"name":"bug","color":"red"}' \
  https://host/api/workspaces/$WS/tags
# → 200 { "id":"...", "name":"bug", "color":"red", "createdAt":"...", "updatedAt":"..." }

# rename
curl -X PATCH -H "Authorization: Bearer $T" -H "content-type: application/json" \
  -d '{"name":"defect"}' \
  https://host/api/workspaces/$WS/tags/$TAG

# delete (каскад в tasks автоматический)
curl -X DELETE -H "Authorization: Bearer $T" \
  https://host/api/workspaces/$WS/tags/$TAG
# → 204
```

---

## 3. Task — новые поля

### 3.1 Что появилось в `TaskDto`

```ts
interface TaskDto {
  // ...старые поля (id, listId, parentId, title, status, priority,
  //   startDate, dueDate, order, depth, path, assigneeId, createdAt, updatedAt)
  tagIds: string[]            // default []
  timeEstimate?: number       // минуты, >= 0
  trackedTime?: number        // минуты, >= 0
}
```

`tagIds` в ответе всегда есть (минимум `[]`). `timeEstimate` и
`trackedTime` — опциональные: при отсутствии поля в документе их
в ответе не будет (нет `null`, нет ключа).

### 3.2 Create (`POST /workspaces/:wsId/tasks`)

```ts
interface CreateTaskDto {
  // ...старые обязательные/опциональные
  tagIds?: string[]           // MongoId[], unique; [] по умолчанию
  timeEstimate?: number       // integer, >= 0
  trackedTime?: number        // integer, >= 0
}
```

- `tagIds` валидируется: `@IsMongoId({ each: true }) @ArrayUnique()`.
  Каждый id должен принадлежать **тому же** workspace — иначе
  `400 "One or more tags do not belong to this workspace"`.
- `timeEstimate` / `trackedTime` — `@IsInt() @Min(0)`. Передавать
  минуты как целое число.

### 3.3 Update (`PATCH /workspaces/:wsId/tasks/:id`)

```ts
interface UpdateTaskDto {
  // ...старые поля
  tagIds?: string[]                       // полная замена
  timeEstimate?: number | null            // null → $unset
  trackedTime?: number | null             // null → $unset
}
```

**Семантика полей — важно:**

| Поле            | `undefined`  | `null`     | number/array               |
|-----------------|--------------|------------|----------------------------|
| `tagIds`        | не менять    | **невалидно** (ArrayUnique/IsMongoId завалит) — используй `[]` для сброса | полностью заменить список  |
| `timeEstimate`  | не менять    | `$unset`   | `$set` новое значение      |
| `trackedTime`   | не менять    | `$unset`   | `$set` новое значение      |

То есть:
- «сбросить оценку» → `PATCH { timeEstimate: null }`
- «очистить теги» → `PATCH { tagIds: [] }`
- «добавить тег» → прочитать текущий `tagIds`, добавить, отправить целиком.
  Backend умышленно не поддерживает `$addToSet`/`$pull` через отдельный
  endpoint — держи список на клиенте и шли массив целиком.

### 3.4 Move / Delete — ничего не изменилось

`POST /:id/move`, `DELETE /:id` работают как раньше. Теги
автоматически сохраняются при move. При delete таск удаляется
целиком — дочистка tagIds не нужна (таск пропал, ссылок больше нет).

### 3.5 Пример create/update

```bash
# create с тегами и оценкой 2h
curl -X POST -H "Authorization: Bearer $T" -H "content-type: application/json" \
  -d '{
    "listId":"'"$LIST"'",
    "title":"Fix login",
    "tagIds":["'"$TAG_BUG"'","'"$TAG_P1"'"],
    "timeEstimate":120
  }' \
  https://host/api/workspaces/$WS/tasks

# обновить tracked + убрать estimate
curl -X PATCH -H "Authorization: Bearer $T" -H "content-type: application/json" \
  -d '{"trackedTime":45,"timeEstimate":null}' \
  https://host/api/workspaces/$WS/tasks/$TASK
```

---

## 4. Цвета тега (enum)

Backend возвращает строковые значения. Они **совпадают один-в-один** с
типом `ElementColor` из ui-kit:

```ts
// libs/ui-kit/src/compose/color/types/ElementColor.ts
export type ElementColor = 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'purple'
```

На web `TagColor` из API и `ElementColor` из ui-kit — **взаимозаменяемы**.
Не делай маппинга между ними, просто прокидывай `tag.color` в компонент
цвета.

Валидация на бэке — `IsEnum`. Любой другой цвет → `ValidationError`.

---

## 5. Web-интеграция

> Ниже — **что нужно сделать в apps/web**, чтобы новый функционал
> проявился в UI. Это не «как устроено», это чек-лист миграции.

### 5.1 Обновить `libs/types/src/task.ts`

```ts
export interface Task {
  // ...существующие поля
  tagIds: string[]
  timeEstimate?: number
  trackedTime?: number
}
```

Добавить `libs/types/src/tag.ts`:

```ts
import type { IsoDateString } from './common'

export type TagColor = 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'purple'

export interface Tag {
  id: string
  name: string
  color: TagColor
  createdAt: IsoDateString
  updatedAt: IsoDateString
}
```

Не забыть `export * from './tag'` в `libs/types/src/index.ts`.

### 5.2 Обновить `apps/web/src/app/api/IRepo.ts`

В `CreateTaskDto` / `UpdateTaskDto` добавить новые поля (см. §3).
Создать `ITagsRepo`:

```ts
export interface CreateTagDto { name: string; color?: TagColor }
export interface UpdateTagDto { name?: string; color?: TagColor }

export interface ITagsRepo {
  list(): Promise<Tag[]>
  get(id: string): Promise<Tag>
  create(dto: CreateTagDto): Promise<Tag>
  update(id: string, patch: UpdateTagDto): Promise<Tag>
  remove(id: string): Promise<void>
}

export interface Repo {
  // ...
  tags: ITagsRepo
}
```

### 5.3 Создать `apps/web/src/tag/api/tagsApi.ts`

Повторить стиль `tasksApi.ts`. Путь строить с учётом
`workspaceId` — см. §1.1 (scope из стора/роутера). Важно:
**после успешного `remove(tagId)`** в сторе тасков пройтись по кэшу
и снести `tagId` из `task.tagIds` у всех задач воркспейса — backend
это уже сделал в базе, но локальный кэш надо синхронизировать сам.

### 5.4 Pinia стор тегов

По образцу `useTasksStore`: список, `byId`, `create/update/remove`.
Теги workspace-scoped — сбрасывай стор при переключении workspace.

### 5.5 UI для времени

- В `timeEstimate` / `trackedTime` хранится целое число минут.
- Рендер: `Math.floor(m/60) + "h " + (m%60) + "m"` (с `trim`, когда одна часть нулевая).
- Input: принимай `"1h 30m"` / `"90"` / `"1.5h"` — парси на клиенте в целые минуты и шли числом.
- Отсутствие оценки (`undefined`) — рисуй «—» или кнопку «Set estimate». Не `0` — 0 минут это
  валидное явное значение, не «пусто».

---

## 6. Типичные флоу

### 6.1 Создать тег и сразу повесить на таск

```ts
const tag = await repo.tags.create({ name: 'bug', color: 'red' })
const task = await repo.tasks.update(taskId, {
  tagIds: [...currentTask.tagIds, tag.id],
})
```

### 6.2 Отфильтровать задачи по тегу (на клиенте)

Backend не даёт серверного фильтра по `tagIds` — фильтруй локально из
`byList`/`byId` стора. Если список станет тяжёлым, поднимем
`GET /tasks?tagId=…` отдельно.

### 6.3 Переименовать тег

```ts
try {
  await repo.tags.update(tagId, { name: 'defect' })
} catch (e) {
  if (e instanceof HttpError && e.status === 409) {
    // имя занято — показать toast, оставить старое
  }
}
```

### 6.4 Удалить тег

Показать confirm с текстом «удалится со всех задач». После DELETE 204 —
чистим локальный стор тасков (пройти `byList`, `filter((t) => t.tagIds.includes(tagId))`,
снять у них `tagIds`).

### 6.5 Трек времени

Поле `trackedTime` — это **не таймер**, а просто число минут, которое
пользователь вводит вручную. Нет start/stop, нет накопления на стороне
бэка. Если сделаем таймер — это новый endpoint/поле, сейчас его нет.

---

## 7. Гочи

1. **Unique `(workspaceId, name)` в теге — строгий.** Дубликат → 409.
   Не 400. `HttpError.status === 409` обрабатывай отдельно от ValidationError.
2. **`tagIds: []` ≠ `tagIds: null`.** `null` не пройдёт валидацию.
   Для «очистить» шли пустой массив.
3. **`timeEstimate: null` — это явный сброс.** Если UI рисует «пусто»
   через `null`, не забудь: `undefined` не отправляй, иначе сервер
   оставит старое значение (частичный PATCH).
4. **`timeEstimate: 0` — валидное значение.** Отличай от «не задано».
   В UI «—» ставь на `undefined`, не на `!timeEstimate`.
5. **Теги на уровне workspace, не space/list.** Если пользователь в
   двух воркспейсах — у каждого свой набор. Отрисовывая таск,
   подгружай теги **из текущего ws**, а не из глобального стора.
6. **После удаления тега backend уже очистил `tagIds` в БД, но не
   пушит ничего во фронт.** У тебя на руках stale таски — вручную
   пройди по кэшу и вычисти.
7. **Кол-во тегов на таске не ограничено.** Если понадобится лимит —
   добавим `@ArrayMaxSize`, сейчас его нет.
8. **`ArrayUnique` на `tagIds`** — дубли в массиве завалят 400. Если
   пользователь дважды кликнул по одному тегу — схлопни локально
   перед отправкой.

---

## 8. Ссылки на код backend

На случай, если дока разошлась с кодом — первоисточники:

- Tag schema — [apps/api/src/adapters/mongo/tag.schema.ts](../../apps/api/src/adapters/mongo/tag.schema.ts)
- Tag enum/DTO — [apps/api/src/domain/entity/tag/](../src/domain/entity/tag/)
- TagService — [apps/api/src/domain/modules/tag/tag.service.ts](../../apps/api/src/domain/modules/tag/tag.service.ts)
- Task schema (новые поля) — [apps/api/src/adapters/mongo/task.schema.ts](../../apps/api/src/adapters/mongo/task.schema.ts)
- Create/Update TaskDto — [apps/api/src/domain/entity/task/](../src/domain/entity/task/)
- Валидация tagIds в task — [apps/api/src/domain/modules/task/task.service.ts](../../apps/api/src/domain/modules/task/task.service.ts) (`create`, `update`)
- Каскад при удалении workspace — [apps/api/src/domain/modules/workspace/workspace.service.ts](../../apps/api/src/domain/modules/workspace/workspace.service.ts) (`delete`)
- REST controller — [apps/api/src/adapters/rest-api/tag/rest-api-tag.controller.ts](../../apps/api/src/adapters/rest-api/tag/rest-api-tag.controller.ts)

Swagger (когда api запущен): `${BASE_PATH}/documentation` — там живые
схемы, если надо перепроверить форму DTO.
