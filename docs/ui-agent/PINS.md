# Pins — контракт для web

> Самодостаточная дока для интеграции pin-сущности на web. Читай холодно:
> кто/что/как, без оглядки на историю обсуждения. Описан _только_ свежий
> функционал (Pin) + минимальный обязательный контекст (auth, base path,
> формат ошибок). Базовые конвенции workspace-scoped API см. в
> [auth-and-workspace.md](./auth-and-workspace.md).

---

## 0. TL;DR

Добавили в backend сущность **Pin** — закреплённый ярлык в сайдбаре /
верхней панели. Указывает на любую «закрепляемую» сущность по паре
`(entity, entityId)` — полиморфная ссылка, без FK.

- Scope: workspace.
- Поля: `label` (1..120, required), `iconName?` (≤64), `order` (auto),
  `entity` (enum), `entityId` (MongoId).
- `entity` строгий enum: `'list' | 'space' | 'view'`. View-сущность в
  бэке уже есть (см. `apps/api/src/domain/modules/view`), но если на
  web она ещё не интегрирована — рисуй пин-«заглушку» (см. §3).
- **Дубликаты разрешены.** Один и тот же `(entity, entityId)` можно
  пинить несколько раз с разными `label`/`iconName`. Уникального индекса
  нет — UI должен сам решать, прятать ли «Pin» в меню, если уже закреплён.
- **Каскад при удалении.** Удалили list/space → все пины с
  `entity='list'`/`'space'` и подходящим `entityId` сносятся автоматически.
  Не нужно подчищать вручную.
- Полный CRUD + reorder под `/api/workspaces/:workspaceId/pins`.

---

## 1. Базовое (нужно для любого запроса)

- Все пути с `/api`. Все ресурсы (кроме `/auth/*` и `/health`)
  workspace-scoped: `/api/workspaces/:workspaceId/...`.
- Авторизация — JWT Bearer: `Authorization: Bearer <token>`.
- `:workspaceId` валидируется guard'ом — не member → `403`.
- Формат ошибок:
  - Домен: `{ "error": "<ExceptionName>", "message": "..." }` —
    `404`, `400` и т.п.
  - Валидация DTO: `{ "error": "ValidationError", "issues": [{ path, message }] }`,
    статус `400`. См. `apps/api/src/adapters/rest-api/pipes/validation-exception.factory.ts`.
- Даты — ISO-строки.

Если ловишь ошибку через `httpClient.ts` — `HttpError.body.error === 'ValidationError'`
отличает валидацию от домена.

---

## 2. Pin API

Корень: `/api/workspaces/:workspaceId/pins`.

### 2.1 Схема DTO

```ts
// Read
interface PinDto {
  id: string
  label: string         // 1..120
  iconName?: string     // optional, ≤64
  order: number         // 0-based, sparse не гарантирован
  entity: PinEntity
  entityId: string      // MongoId исходной сущности
  createdAt: string     // ISO
  updatedAt: string     // ISO
}

// Create
interface CreatePinDto {
  label: string         // required, 1..120
  iconName?: string     // optional, ≤64
  entity: PinEntity     // required
  entityId: string      // required, MongoId
}

// Update (PATCH — частичный)
interface UpdatePinDto {
  label?: string        // 1..120
  iconName?: string     // ≤64
  // entity / entityId — не редактируются. Хочешь перепинить
  // на другую сущность — удали и создай заново.
}

// Reorder
interface ReorderItemDto {
  id: string            // MongoId пина
  order: number         // integer >= 0
}

type PinEntity = 'list' | 'space' | 'view'
```

### 2.2 Эндпоинты

| Метод  | Путь                                            | Тело                | Ответ                       | Notes                                          |
|--------|-------------------------------------------------|---------------------|-----------------------------|------------------------------------------------|
| GET    | `/api/workspaces/:wsId/pins`                    | —                   | `PinDto[]` sorted by `order` asc | Все пины workspace в порядке отображения  |
| POST   | `/api/workspaces/:wsId/pins`                    | `CreatePinDto`      | `PinDto`                    | `order` назначается автоматически (max+1)      |
| PATCH  | `/api/workspaces/:wsId/pins/:id`                | `UpdatePinDto`      | `PinDto`                    | Меняет только label/iconName                   |
| DELETE | `/api/workspaces/:wsId/pins/:id`                | —                   | `204` (без тела)            |                                                |
| POST   | `/api/workspaces/:wsId/pins/reorder`            | `ReorderItemDto[]`  | `204`                       | Атомарный bulkWrite, апдейтит только `order`/`updatedAt` |

### 2.3 Правила и поведение

- **`order` назначается сервером при создании.** Бэк берёт max(order) +
  1 в рамках workspace. Передавать `order` в `POST` бессмысленно —
  он не входит в `CreatePinDto`. Перетаскиваешь — шли `POST /reorder`.
- **Нет проверки существования `entityId`.** Бэк не валидирует, что
  list/space с таким id реально существует. Если за-pin'ил «в воздух»
  — сам виноват. Делается так умышленно: ссылка полиморфная, и
  заглядывать в чужую коллекцию на каждый create было бы дорого.
  ⇒ **UI должен** на стороне формы показывать только реально
  существующие сущности.
- **Каскад при удалении сущности.**
  - `DELETE /spaces/:id` → удаляет space + lists + tasks + pins на
    space + pins на все lists этого space.
  - `DELETE /lists/:id` → удаляет list + tasks + pins на этот list.
  - `DELETE /workspaces/:id` → удаляет всё, включая pins.
  - Бэк всё это делает сам (см. §6). Фронту после успешного DELETE
    list/space нужно локально снести из стора пинов те, у которых
    `entity` совпадает и `entityId` равен удалённому. См. §5.3.
- **Дубликаты разрешены.** Создание пина на уже-закреплённый
  `(entity, entityId)` пройдёт без ошибки. Если хочешь UX «один пин —
  одна сущность» — проверяй на клиенте перед `POST` (поиском по
  кэшу пинов).
- **PATCH строго частичный.** `undefined` поле = «не менять». Полный
  reset поля через `null` **не поддержан** для `iconName` (заголовок
  `IsString`/`IsOptional` без `null`). Если нужно убрать иконку —
  передай пустую строку `""` (но валидатор `MaxLength(64)` пропустит,
  а `IsString` пропустит) → бэк сохранит `""`. Сейчас явного `$unset`
  для `iconName` нет, см. гочи §7.4.
- **Валидация:**
  - `label`: `IsString`, `IsNotEmpty`, `MinLength(1)`, `MaxLength(120)`.
  - `iconName`: `IsString`, `IsOptional`, `MaxLength(64)`. Произвольная
    строка — формат имени иконки бэк не валидирует, договаривайся с UI.
  - `entity`: `IsEnum(EPinEntity)`, `IsNotEmpty`. Любое другое значение
    → `400 ValidationError`.
  - `entityId`: `IsMongoId`. Не-mongoid → `400 ValidationError`.
- **Reorder идемпотентен.** Можно слать частичный список (например,
  только переехавшие) или полный — бэк просто `bulkWrite` с
  `updateOne` по каждому элементу. Несуществующие id молча пропускаются
  (`updateOne` на 0 документов). Перед reorder сам решай, отправлять
  полный snapshot или дельту.

### 2.4 Коды ошибок

| Код | Когда                                                              |
|-----|--------------------------------------------------------------------|
| 400 | `ValidationError` (label длиннее 120, entity не в enum, entityId не MongoId, и т.д.) |
| 401 | Нет/битый Bearer                                                   |
| 403 | `WorkspaceAccessGuard` (не member workspace)                       |
| 404 | `Pin not found` — на `PATCH`/`DELETE`, если такого id нет в этом ws |

`409` для пинов **не используется** — дубликаты разрешены.

### 2.5 Примеры

```bash
# list
curl -H "Authorization: Bearer $T" \
  https://host/api/workspaces/$WS/pins
# → 200 [ { "id":"...", "label":"My list", "iconName":"star", "order":0,
#         "entity":"list", "entityId":"...", "createdAt":"...", "updatedAt":"..." }, ... ]

# create (закрепить list)
curl -X POST -H "Authorization: Bearer $T" -H "content-type: application/json" \
  -d '{
    "label":"Quick tasks",
    "iconName":"star",
    "entity":"list",
    "entityId":"'"$LIST"'"
  }' \
  https://host/api/workspaces/$WS/pins
# → 200 PinDto, order = (max+1)

# rename / change icon
curl -X PATCH -H "Authorization: Bearer $T" -H "content-type: application/json" \
  -d '{"label":"Inbox","iconName":"inbox"}' \
  https://host/api/workspaces/$WS/pins/$PIN

# reorder (полный snapshot)
curl -X POST -H "Authorization: Bearer $T" -H "content-type: application/json" \
  -d '[
    {"id":"'"$PIN_A"'","order":0},
    {"id":"'"$PIN_B"'","order":1},
    {"id":"'"$PIN_C"'","order":2}
  ]' \
  https://host/api/workspaces/$WS/pins/reorder
# → 204

# delete
curl -X DELETE -H "Authorization: Bearer $T" \
  https://host/api/workspaces/$WS/pins/$PIN
# → 204
```

---

## 3. Семантика поля `entity`

```ts
type PinEntity = 'list' | 'space' | 'view'
```

| Значение | Что значит                                                      | Кэш для resolve в стороне UI    |
|----------|-----------------------------------------------------------------|--------------------------------|
| `list`   | Pin указывает на List. `entityId` = `list.id`.                  | `useListsStore` (по spaceId)   |
| `space`  | Pin указывает на Space. `entityId` = `space.id`.                | `useSpacesStore`               |
| `view`   | Pin указывает на View. `entityId` = `view.id`.                  | `useViewsStore` (если есть)    |

UI должен:
1. Маппить `entity` в источник данных (что отрисовать как label/иконку
   рядом с пином — например, цвет space). `label` пина — это
   «отображаемое имя в сайдбаре», оно не обязано совпадать с именем
   исходной сущности; пользователь мог переименовать пин.
2. По клику на пин — навигировать в соответствующий route (`/w/:wsId/spaces/:entityId`,
   `/w/:wsId/lists/:entityId`, и т.д.).
3. Если `entity` в ответе — неизвестное значение (новый бэк, старый
   фронт): не падать, рисовать пин с дефолтной иконкой и без навигации,
   логировать warning.

---

## 4. Поведение каскадов (важно для UI-кэша)

Бэк сам подчищает пины, когда исходная сущность пропадает. Полный список:

| Что удалили         | Какие пины снесёт                                                       | Где в коде                                      |
|---------------------|-------------------------------------------------------------------------|-------------------------------------------------|
| `DELETE list`       | все pins, у которых `entity='list' AND entityId=<listId>`               | [list.service.ts](../../apps/api/src/domain/modules/list/list.service.ts) `delete` |
| `DELETE space`      | (a) pins на сам space + (b) pins на все его lists (через listService.deleteBySpaceId) | [space.service.ts](../../apps/api/src/domain/modules/space/space.service.ts) `delete` |
| `DELETE workspace`  | все pins workspace                                                      | [workspace.service.ts](../../apps/api/src/domain/modules/workspace/workspace.service.ts) `delete` |

**Бэк не пушит изменения во фронт.** После успешного `DELETE
list`/`space` UI обязан сам пройтись по сторе пинов и убрать те,
что указывали на удалённую сущность. Конкретно — см. §5.3.

---

## 5. Web-интеграция

> Это **что нужно сделать в apps/web**, чтобы пины проявились в UI.
> Чек-лист миграции, не описание устройства.

### 5.1 Добавить тип в `libs/types/src/`

Создать `libs/types/src/pin.ts`:

```ts
import type { IsoDateString } from './common'

export type PinEntity = 'list' | 'space' | 'view'

export interface Pin {
  id: string
  label: string
  iconName?: string
  order: number
  entity: PinEntity
  entityId: string
  createdAt: IsoDateString
  updatedAt: IsoDateString
}
```

И `export * from './pin'` в `libs/types/src/index.ts`.

### 5.2 Добавить `IPinsRepo` в `apps/web/src/app/api/IRepo.ts`

```ts
export interface CreatePinDto {
  label: string
  iconName?: string
  entity: PinEntity
  entityId: string
}

export interface UpdatePinDto {
  label?: string
  iconName?: string
}

export interface ReorderItem { id: string; order: number }

export interface IPinsRepo {
  list(): Promise<Pin[]>
  create(dto: CreatePinDto): Promise<Pin>
  update(id: string, patch: UpdatePinDto): Promise<Pin>
  remove(id: string): Promise<void>
  reorder(items: ReorderItem[]): Promise<void>
}

export interface Repo {
  // ...
  pins: IPinsRepo
}
```

### 5.3 Создать `apps/web/src/pin/api/pinsApi.ts`

По образцу `tagsApi.ts` / `listsApi.ts`. Путь — `/api/workspaces/${wsId}/pins`.

**Важно:** обработчики `lists.remove(listId)` и `spaces.remove(spaceId)`
после успешного 204 должны позвать в стор пинов:

```ts
// псевдокод
async function removeList(listId: string) {
  await api.lists.remove(listId)
  pinsStore.dropByEntity('list', [listId])
  // уже существующая логика с tasks/lists остаётся как была
}

async function removeSpace(spaceId: string) {
  // прежде чем дропнуть space — собрать listIds этого space из стора
  const affectedListIds = listsStore.byList.value
    .filter((l) => l.spaceId === spaceId).map((l) => l.id)
  await api.spaces.remove(spaceId)
  pinsStore.dropByEntity('space', [spaceId])
  pinsStore.dropByEntity('list', affectedListIds)
}
```

Это синхронизация локального кэша с тем, что бэк уже сделал в БД.

### 5.4 Pinia стор пинов

Минимальный API стора:

```ts
interface PinsStore {
  items: Ref<Pin[]>           // отсортированы по order asc
  loading: Ref<boolean>

  load(): Promise<void>       // GET /pins
  create(dto: CreatePinDto): Promise<Pin>
  update(id: string, patch: UpdatePinDto): Promise<Pin>
  remove(id: string): Promise<void>
  reorder(orderedIds: string[]): Promise<void>   // принимает финальный порядок

  // вызывают другие сторы при cascade
  dropByEntity(entity: PinEntity, entityIds: string[]): void
}
```

- `items` всегда отсортирован по `order` asc — поддерживай инвариант
  при `create`/`update`/`reorder` локально (бэк уже даёт отсортированный
  ответ на `GET`, но при оптимистичных апдейтах отвечать за сортировку
  будет стор).
- `reorder(orderedIds)` мапит в `[{id, order: i}]` и шлёт в `POST
  /pins/reorder`.
- Сбрасывай стор при переключении workspace (как все остальные
  workspace-scoped сторы).

### 5.5 Resolve пинов в UI

Сайдбар рисует пины — для каждого нужно понимать, на что он указывает,
чтобы:

- сформировать ссылку (`/w/:wsId/spaces/:entityId` и т.п.);
- подтянуть «вторичные» данные (например, цвет space).

Подход: в компоненте сайдбара мапить пины через `useSpacesStore` /
`useListsStore`. Если по `entityId` ничего не нашлось — пин «висит в
воздухе» (бэк не валидирует существование). Варианты:

1. Скрыть такой пин в UI и в фоне дёрнуть `pins.remove(id)` (если
   уверены, что отсутствие = удалена сущность, а не отстал кэш).
2. Показать с пометкой «недоступно» и кнопкой убрать.

Для MVP — вариант 2: безопаснее, не теряем данные на ошибке кэша.

### 5.6 UI элементы

Минимальный комплект:

- **Сайдбар-секция «Pinned»** (или верхняя панель) — список пинов
  отсортирован по `order`, отрисовывает `iconName` (если есть) +
  `label`. Кликабельно.
- **Drag-and-drop reorder** — на drop отправлять
  `pinsStore.reorder(newOrderedIds)`. Между запросом и ответом держать
  оптимистичный порядок локально; на ошибке откатывать.
- **Контекстное меню на пине** — `Rename` (правит `label`),
  `Change icon` (правит `iconName`), `Unpin` (DELETE).
- **Кнопка «Pin» на сущности** (Space, List в их собственных меню) —
  открывает диалог `Label` + `Icon` (опц.) → `pins.create({ entity,
  entityId, label, iconName })`. Дефолт `label` = имя сущности.
  Дефолт `iconName` — не присылать поле.
- (опц.) Бейдж **«Pinned»** на сущности, если в сторе пинов есть
  запись с её `(entity, entityId)`. Помогает не плодить дубли.

---

## 6. Ссылки на код backend

На случай, если дока разошлась с кодом:

- Pin schema — [apps/api/src/adapters/mongo/pin.schema.ts](../../apps/api/src/adapters/mongo/pin.schema.ts)
- Pin enum — [apps/api/src/domain/entity/pin/pin.constants.ts](../../apps/api/src/domain/entity/pin/pin.constants.ts)
- DTO (Pin/Create/Update) — [apps/api/src/domain/entity/pin/](../../apps/api/src/domain/entity/pin/)
- PinService — [apps/api/src/domain/modules/pin/pin.service.ts](../../apps/api/src/domain/modules/pin/pin.service.ts)
- REST controller — [apps/api/src/adapters/rest-api/pin/rest-api-pin.controller.ts](../../apps/api/src/adapters/rest-api/pin/rest-api-pin.controller.ts)
- Каскад из List → Pin — [apps/api/src/domain/modules/list/list.service.ts](../../apps/api/src/domain/modules/list/list.service.ts) (`delete`, `deleteBySpaceId`)
- Каскад из Space → Pin — [apps/api/src/domain/modules/space/space.service.ts](../../apps/api/src/domain/modules/space/space.service.ts) (`delete`)
- Каскад из Workspace → Pin — [apps/api/src/domain/modules/workspace/workspace.service.ts](../../apps/api/src/domain/modules/workspace/workspace.service.ts) (`delete`)

Swagger (когда api запущен): `${BASE_PATH}/documentation` — там живые
схемы.

---

## 7. Гочи

1. **`order` всегда сервер.** На `POST` не передаётся, на `PATCH` не
   меняется. Хочешь поменять порядок — только `POST /pins/reorder`.
2. **Нет проверки на существование `entityId` при create.** Бэк
   доверяет UI. Можно создать пин с произвольным MongoId — он будет
   жить в БД и фейлить resolve в UI. Не используй это «удобно»,
   фильтруй на стороне формы.
3. **Дубликаты разрешены.** Один list можно за-pin'ить дважды. UI сам
   решает, прятать ли «Pin» в меню сущности, если уже закреплено.
4. **`iconName` нельзя «сбросить» через `null`.** `null` не пройдёт
   `IsString` валидацию (если ставить `IsOptional` — `undefined`
   игнорируется, `null` — нет). Чтобы убрать иконку — передай пустую
   строку `""`, бэк сохранит `""`. Если это критично, стоит вынести в
   отдельный тикет: добавить явный `$unset` через DTO с `IsOptional()
   @ValidateIf((o) => o.iconName !== null)`.
5. **Каскад для `entity='view'` пока не реализован в PinService.**
   `pinService.deleteByEntity` зовётся только из List и Space service.
   Если ViewService удаляет view — пин на него останется висеть.
   Когда понадобится — добавить вызов в `view.service.ts:delete`
   по аналогии с `list.service.ts:delete`.
6. **Reorder — `bulkWrite`, не транзакция.** Если в массиве 10 элементов
   и для одного `id` нет документа — он молча пропускается, остальные
   обновляются. Не закладывайся на «всё или ничего».
7. **После DELETE list/space фронт обязан синхронизировать стор пинов**
   (см. §5.3). Бэк сам почистил БД, но push-уведомлений нет, так что
   подтянуть `GET /pins` или вычистить локально — на тебе.
8. **Стор пинов — workspace-scoped.** Сбрасывать на каждом
   переключении workspace, как `tasks`/`tags`/`lists`.
