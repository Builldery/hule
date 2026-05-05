# Views — контракт для web

> Самодостаточная дока для интеграции UI поверх новой сущности View.
> Читай холодно: что такое View, как построить запрос, что приходит
> в ответе, какие правила инвариантов. История обсуждения не нужна.

---

## 0. TL;DR

- **View** — это контейнер «как отобразить набор листов». Поля:
  `label` (название), `kind` (`kanban` | `list` | `timeline`),
  `listIds` (массив id листов, к которым относится этот view).
- View живёт на уровне **workspace**. `listIds` могут ссылаться на
  любые листы любого space внутри того же workspace.
- Полный CRUD под `/api/workspaces/:workspaceId/views`. Reorder
  не поддерживается. Сортировка по `createdAt ASC`.
- При удалении листа сервер сам делает `$pull` этого id из
  `listIds` всех затронутых views. UI ничего дополнительно
  чистить не нужно.
- При удалении workspace все views этого workspace удаляются
  каскадно. При удалении View также удаляются Pin'ы, ссылающиеся
  на этот view (`entity = 'view'`).

---

## 1. Базовое (нужно, чтобы собрать любой запрос)

### 1.1 Base URL + auth

- Все пути начинаются с `/api`.
- View — workspace-scoped: префикс `/api/workspaces/:workspaceId/views`.
- Авторизация — JWT Bearer: `Authorization: Bearer <token>`.
  Токен выдаёт `/api/auth/login`. Подробнее — см.
  `docs/ui-agent/auth-and-workspace.md`.
- `:workspaceId` валидируется guard'ом: если юзер не member
  воркспейса → 403.

### 1.2 Формат ответов

- JSON, `content-type: application/json`.
- Успех: `200` (или `204` для DELETE без тела).
- Даты — ISO-строки (`createdAt`, `updatedAt`).

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
    { "path": ["label"], "message": "label should not be empty" }
  ]
}
```

`HttpError.body` в `httpClient.ts` (apps/web/src/app/api/httpClient.ts)
даёт эти поля целиком — по `body.error === 'ValidationError'`
отличай валидацию от домена.

### 1.4 Коды, с которыми столкнёшься

| Код | Когда                                                                                |
|-----|--------------------------------------------------------------------------------------|
| 200 | Любой успешный GET/POST/PATCH                                                        |
| 204 | Успешный DELETE                                                                      |
| 400 | Невалидный body, или один из `listIds` не принадлежит этому workspace                |
| 401 | Нет/протух JWT                                                                       |
| 403 | JWT валиден, но юзер не member указанного workspace                                  |
| 404 | View с таким id не найден в этом workspace                                           |

---

## 2. HTTP-контракт

Везде ниже подразумевается `Authorization: Bearer <token>` и валидный
`:workspaceId` пользователя.

### 2.1 List

```
GET /api/workspaces/:workspaceId/views
→ 200 ViewDto[]
```

Возвращает все views workspace, отсортированные по `createdAt ASC`.

### 2.2 Get by id

```
GET /api/workspaces/:workspaceId/views/:id
→ 200 ViewDto
→ 404 если не существует
```

### 2.3 Create

```
POST /api/workspaces/:workspaceId/views
Body: CreateViewDto
→ 200 ViewDto
```

Сервер валидирует, что **все** `listIds` (если переданы) существуют
в указанном workspace. Иначе → 400 `One or more listIds do not belong
to this workspace`. Пустой/отсутствующий `listIds` сохраняется как `[]`.

### 2.4 Update

```
PATCH /api/workspaces/:workspaceId/views/:id
Body: UpdateViewDto  (любое подмножество полей)
→ 200 ViewDto
→ 404 если не существует
```

Все три поля патчатся независимо. **`listIds` в PATCH полностью
заменяет** текущий массив (а не добавляется/удаляется per-element).
Та же проверка принадлежности listIds workspace, что и в create.

`label` и `kind` не сбрасываются — передавать `null` для них смысла
не имеет, валидация запретит.

### 2.5 Delete

```
DELETE /api/workspaces/:workspaceId/views/:id
→ 204 No Content
→ 404 если не существует
```

Удаление View также удаляет все Pin'ы с `entity='view'` и
`entityId=:id` (см. модуль Pin).

---

## 3. DTO shapes

```ts
// libs/types/src/view.ts (shared)

export type ViewKind = 'kanban' | 'list' | 'timeline'

export interface View {
  id: string
  label: string
  kind: ViewKind
  listIds: string[]      // id листов; могут быть из разных space одного ws
  createdAt: string      // ISO
  updatedAt: string      // ISO
}

export interface CreateViewDto {
  label: string          // required, 1..120 chars
  kind: ViewKind         // required
  listIds?: string[]     // optional; default []; каждый — валидный MongoId
}

export interface UpdateViewDto {
  label?: string         // 1..120 chars
  kind?: ViewKind
  listIds?: string[]     // полностью заменяет; каждый — валидный MongoId
}
```

Валидация на бэкенде (class-validator):

- `label` — `IsString`, `IsNotEmpty`, `MinLength(1)`, `MaxLength(120)`.
- `kind` — `IsEnum(EViewKind)`.
- `listIds` — `IsArray`, `ArrayUnique`, `IsMongoId({each:true})`,
  плюс runtime-проверка принадлежности к workspace в сервисе.

---

## 4. Каскады (что делает бэкенд за тебя)

1. **Удаление списка (`List`)** → сервер делает `$pull` этого
   `listId` из `View.listIds` во всех views workspace. UI не должен
   фильтровать/чинить ссылки самостоятельно — просто перезагрузи
   список views, если важна свежесть.
2. **Удаление space** → каскадно удаляет все его листы → срабатывает
   тот же `$pull` для views.
3. **Удаление workspace** → удаляет все views этого workspace.
4. **Удаление view** → удаляет привязанные Pin'ы (entity=`view`).

Ничего из этого UI делать не нужно. Но если на странице открыт
view, чьи `listIds` могли поменяться, после удаления листа имеет
смысл сделать `GET /views/:id` (или просто перечитать список).

---

## 5. Связь с существующими сущностями

### 5.1 Pin

В `EPinEntity` уже есть значение `'view'`. Чтобы прикрепить view
в сайдбаре:

```
POST /api/workspaces/:workspaceId/pins
{
  "label": "Sprint board",
  "entity": "view",
  "entityId": "<viewId>",
  "iconName": "kanban"   // optional
}
```

См. существующий PinService — никакой специальной интеграции
со стороны View не нужно, кроме того что pin'ы чистятся при
удалении view (это уже сделано).

### 5.2 ListView.vue (фронт)

В текущем коде `apps/web/src/list/views/ListView.vue` есть
локальный `mode: 'list' | 'kanban' | 'timeline'`, хранящийся в
query-параметре роута. Это режим отображения **одного** листа,
сейчас не персистится. Новый View — это **именованный, персистентный**
объект, который может покрывать **несколько** листов и хранится
на сервере. Это разные слои; их можно использовать независимо
или совместить позже (например, открыть view → перейти на
страницу с тем же `kind`, но с listId-набором).

---

## 6. Что нужно реализовать на фронте (предложение)

Минимальный план для новой UI-сессии:

1. **API-клиент**: `apps/web/src/view/api/viewsApi.ts` со
   стандартными методами (`list`, `getById`, `create`, `update`,
   `remove`). Базовый путь: `/api/workspaces/{wsId}/views`.
   Используй существующий `http` хелпер из `apps/web/src/app/api/httpClient.ts`
   (как в `apps/web/src/list/api/listsApi.ts`).
2. **Repo-интерфейс**: добавь `IViewsRepo` в
   `apps/web/src/app/api/IRepo.ts` рядом с `IListsRepo`.
3. **Pinia-store**: `apps/web/src/view/store/useViewsStore.ts`.
   Состояние `byId: Record<string, View>` + `loading`. Действия
   `loadAll(wsId)`, `create`, `update`, `remove`. Шаблон —
   `apps/web/src/list/store/useListsStore.ts`.
4. **Типы импорти из `@hule/types`** (`View`, `ViewKind`,
   `CreateViewDto`, `UpdateViewDto`). НЕ дублируй их в web.
5. **UI** (отдельный шаг):
   - страница со списком views workspace + кнопка «Создать view»;
   - модалка создания/редактирования (`label`, `kind` как radio,
     `listIds` как мульти-селект из листов всех space данного ws);
   - роут `/workspaces/:wsId/views/:id` — рендерит компонент по
     `view.kind`:
     - `list` → таблица всех тасков из `view.listIds` (есть
       `TaskListMode` с пропом `listId` — можно отрендерить N
       раз или сделать обёртку);
     - `kanban` → `KanbanBoard` (см. `apps/web/src/kanban/`);
     - `timeline` → `GanttView` (см. `apps/web/src/timeline/`).

Сами компоненты `KanbanBoard`/`GanttView`/`TaskListMode` сейчас
заточены под один `listId`. Если нужно много листов — либо
рендеришь несколько таких компонентов, либо расширяешь их
поддержку нескольких `listIds`. Это уже не часть бэкенд-контракта
и зависит от продуктовых решений.

---

## 7. Файлы на бэкенде (для отладки/референса)

| Слой              | Файл                                                                        |
|-------------------|-----------------------------------------------------------------------------|
| Схема             | `apps/api/src/adapters/mongo/view.schema.ts`                                |
| Enum kind         | `apps/api/src/domain/entity/view/view.constants.ts` (`EViewKind`)           |
| DTO ответа        | `apps/api/src/domain/entity/view/view.dto.ts`                               |
| DTO create        | `apps/api/src/domain/entity/view/create-view.dto.ts`                        |
| DTO update        | `apps/api/src/domain/entity/view/update-view.dto.ts`                        |
| Сервис            | `apps/api/src/domain/modules/view/view.service.ts`                          |
| Domain-модуль     | `apps/api/src/domain/modules/view/view.module.ts`                           |
| Контроллер        | `apps/api/src/adapters/rest-api/view/rest-api-view.controller.ts`           |
| REST-модуль       | `apps/api/src/adapters/rest-api/view/rest-api-view.module.ts`               |
| Регистрация       | `apps/api/src/adapters/rest-api/rest-api.module.ts` (`RestApiViewModule`)   |
| Каскад list→view  | `ListService.delete` / `deleteBySpaceId` → `viewService.pullListIds`        |
| Каскад ws→view    | `WorkspaceService.delete` → `viewService.deleteByWorkspaceId`               |
| Shared types      | `libs/types/src/view.ts` (re-exported из `@hule/types`)                     |

---

## 8. Примеры

### 8.1 Создать view с двумя листами

```http
POST /api/workspaces/65f0.../views
Authorization: Bearer ...
Content-Type: application/json

{
  "label": "Q2 Roadmap",
  "kind": "timeline",
  "listIds": ["6601a...", "6601b..."]
}
```

Ответ:

```json
{
  "id": "6610c...",
  "label": "Q2 Roadmap",
  "kind": "timeline",
  "listIds": ["6601a...", "6601b..."],
  "createdAt": "2026-05-05T10:14:33.000Z",
  "updatedAt": "2026-05-05T10:14:33.000Z"
}
```

### 8.2 Сменить тип отображения

```http
PATCH /api/workspaces/65f0.../views/6610c...
{ "kind": "kanban" }
```

### 8.3 Заменить набор листов целиком

```http
PATCH /api/workspaces/65f0.../views/6610c...
{ "listIds": ["6601a..."] }
```

### 8.4 Удалить view

```http
DELETE /api/workspaces/65f0.../views/6610c...
→ 204
```

---

## 9. Что **не** реализовано (намеренно)

- Нет порядка/reorder для views — сортировка фиксирована по
  `createdAt`. Если потом понадобится — добавим поле `order`
  как у `List`/`Pin`.
- Нет фильтра в `GET` (по kind, по listId и т.п.) — отдаём все
  views workspace; web сам фильтрует/индексирует в Pinia-store.
- Нет share/permission на уровне view — View виден всем members
  workspace (как и любые другие сущности этого workspace).
- На фронте пока ничего нет: ни API-клиента, ни Pinia-store, ни UI.
  Это следующий шаг.
