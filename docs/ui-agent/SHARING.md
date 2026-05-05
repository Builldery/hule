# Sharing — контракт для web

> Самодостаточная дока для интеграции space-sharing на web. Читай холодно:
> кто/что/как, без оглядки на историю обсуждения. Базовые конвенции
> (auth, base path, формат ошибок, workspace-scoped пути) см. в
> [auth-and-workspace.md](./auth-and-workspace.md).

---

## 0. TL;DR

Я (A) могу расшарить свой **Space** (вместе со всеми его лист'ами и тасками
внутри) другому пользователю (B) по email. B видит этот space в своём
сайдбаре в отдельной секции «Shared with me» — **без переключения** в мой
workspace. Доступ — read-only (`role: 'viewer'`).

**Pin** и **View** теперь per-user. B может пинить мои расшаренные листы /
спейсы и собирать из них свои views — всё это живёт в B's workspace, но
указывает на foreign entity через `entityWorkspaceId` / `listRefs[].workspaceId`.

Что меняется в API (в формате diff):

- `Space.workspaceId` теперь возвращается в ответе (раньше скрывалось).
- `Space.sharedWith: [{ userId, role }]` — новое поле.
- `List.workspaceId` теперь возвращается в ответе.
- `Pin.userId: string | null` — новое поле; `null` означает legacy-пин (виден всем).
- `Pin.entityWorkspaceId: string | null` — новое поле; не-null = пин на сущность из другого workspace.
- `View.userId: string | null` — новое поле.
- `View.listIds: string[]` ❌ удалено в DTO. Вместо него `View.listRefs: [{ listId, workspaceId }]`.
- `CreateViewDto/UpdateViewDto.listIds` ❌ удалено. Передавай `listRefs`.

Новые роуты:

- `POST   /api/spaces/:spaceId/shares` — расшарить space (owner-only).
- `DELETE /api/spaces/:spaceId/shares/:userId` — снять share.
- `GET    /api/shared-spaces` — что мне расшарили (вместе с листами и инфо об owner).
- `GET    /api/shared-lists/:listId/tasks?includeSubtasks=...` — таски по расшаренному листу.

---

## 1. Базовое (нужно для любого запроса)

- Все пути с `/api`. JWT Bearer в `Authorization`.
- **Важно:** новые роуты `/api/spaces/...`, `/api/shared-spaces`,
  `/api/shared-lists/...` **не** workspace-scoped — `:workspaceId` в URL
  нет, и `WorkspaceAccessGuard` их пропускает. Доступ проверяется внутри
  сервиса (по ownerId workspace для share/unshare, по `Space.sharedWith`
  для read-only маршрутов).
- Ошибки — стандартные HTTP коды:
  - `403` — пытаешься расшарить чужой space (только owner workspace может).
  - `404` — space/list/user не найден или нет доступа.
  - `400` — расшариваешь сам себе, повторный share, невалидные id.

---

## 2. HTTP контракты

### 2.1 Расшарить space (owner workspace только)

```
POST /api/spaces/:spaceId/shares
Body: { email: string, role?: 'viewer' | 'editor' }
Response: SpaceDto  // с обновлённым sharedWith[]
```

- `email` — почта существующего пользователя. Не существует → `404`.
- `role` опциональный, дефолт `'viewer'`. **В MVP только `'viewer'` имеет
  эффект** — `'editor'` принимается схемой, но интерпретируется как
  read-only. Можно сейчас слать только `'viewer'`.
- Расшарить себе самому → `400`.
- Повторный share того же юзера — обновляет role у существующей записи
  (idempotent), не создаёт дубликат.

### 2.2 Снять share

```
DELETE /api/spaces/:spaceId/shares/:userId
Response: SpaceDto  // sharedWith[] без удалённого юзера, статус 200
```

Owner workspace только. Если share не существует — всё равно вернёт 200 с
актуальным `sharedWith`.

> ⚠️ **Известное ограничение MVP.** При снятии share **не чистятся**:
> - пины B, указывающие на entity в этом space (Pin.entityWorkspaceId);
> - listRefs во views B, указывающие на листы этого space.
> Они продолжают существовать, но при попытке прочитать таски будет `404/403`.
> На UI стоит показывать «No access» бейдж и давать кнопку удалить.

### 2.3 Что мне расшарили

```
GET /api/shared-spaces
Response: SharedSpace[]
```

```ts
interface SharedSpace {
  space: Space        // полный SpaceDto, включая workspaceId — это foreign workspace
  lists: List[]       // все листы этого space, отсортированы по order
  owner: { id: string; name: string; email: string }
  role: 'viewer' | 'editor'
}
```

- Сортировка: spaces по `order`, lists внутри каждого — по `order`.
- Пустой ответ `[]` если ничего не расшарено.
- Это **единственный** запрос, чтобы построить дерево «Shared with me» в
  сайдбаре. Дополнительно дёргать `/api/workspaces/<foreign>/lists?spaceId=...`
  не нужно (и нельзя — `WorkspaceAccessGuard` отрежет).

### 2.4 Таски расшаренного листа

```
GET /api/shared-lists/:listId/tasks?includeSubtasks=false
Response: Task[]
```

- Семантика идентична `GET /api/workspaces/:wsId/tasks?listId=<id>` — тот же
  TaskService под капотом, только проверка доступа другая (ищет share в
  `Space.sharedWith`).
- Если у юзера нет доступа к листу (никогда не шарили или сняли share) → `403`.
- Read-only. POST/PATCH/DELETE на shared таски в MVP **не поддерживаются**.
- Поддтаски, timeline, отдельный таск по id и subtree — в MVP не вынесены
  в shared-API. Для MVP UI достаточно плоского списка тасков. Если нужно —
  скажи, добавлю.

---

## 3. Изменения в существующих DTO

Это критичная часть — старый код ломается на типах.

### 3.1 Space

```ts
// ДО
interface Space {
  id; name; color?; iconName?; order; createdAt; updatedAt
}

// ПОСЛЕ
interface Space {
  id
  workspaceId               // ← новое: всегда возвращается
  name; color?; iconName?; order
  sharedWith: SpaceShareEntry[]   // ← новое: пустой массив для не-расшаренных
  createdAt; updatedAt
}

interface SpaceShareEntry { userId: string; role: 'viewer' | 'editor' }
```

**Что показывать на UI:**
- В контекстном меню space у меня (где я owner): пункт «Share…» открывает
  модалку с полем email + списком уже расшаренных (`sharedWith`) с
  возможностью убрать.
- В space-карточке для расшаренного — бейдж «Shared with N» если
  `sharedWith.length > 0`.

### 3.2 List

```ts
interface List {
  id
  workspaceId        // ← новое
  spaceId
  name; iconName?; order
  createdAt; updatedAt
}
```

`workspaceId` нужен, чтобы отличать «свой» лист от расшаренного. Свой
лист → дёргаем `GET /api/workspaces/:wsId/tasks?listId=...`. Чужой
(`workspaceId !== currentWorkspaceId`) → `GET /api/shared-lists/:listId/tasks`.

### 3.3 Pin (per-user, может ссылаться на чужой workspace)

```ts
interface Pin {
  id
  workspaceId         // workspace, в котором живёт сам пин (= currentWorkspaceId)
  userId: string | null   // ← новое; null = legacy (видим всем участникам, не трогать)
  label; iconName?; order
  entity: 'list' | 'space' | 'view'
  entityId
  entityWorkspaceId: string | null   // ← новое; не-null = пин на foreign entity
  createdAt; updatedAt
}

interface CreatePinDto {
  label; iconName?; entity; entityId
  entityWorkspaceId?: string   // ← новое опциональное поле
}
```

**Логика:**

- Бэк теперь фильтрует `GET /pins` по `(workspaceId, userId === me OR userId === null)`.
  Никаких изменений в URL — просто пины каждого юзера свои.
- Чтобы запинить расшаренный лист/спейс: послать `entity`, `entityId` и
  `entityWorkspaceId` равный foreign workspaceId. Бэк проверит, что у юзера
  реально есть share, иначе `403/400`.
- При рендере пина: если `entityWorkspaceId !== null && entityWorkspaceId !== currentWorkspaceId`,
  ресолвить entity через shared-роуты (`/api/shared-spaces` для метаданных
  list/space, `/api/shared-lists/:id/tasks` если открываем).
- Legacy-пины (`userId === null`) сейчас видны всем — это пины, созданные
  до миграции. UI может показывать их со специальным маркером или
  тихо переписать на текущего юзера через PATCH (PATCH сам по себе
  userId не меняет — нужно будет отдельный механизм; для MVP оставь как есть).
- Каскад при удалении entity (свой или чужой) уже работает: удалили лист
  в A — пины B, указывающие на этот listId, тоже снесутся.

### 3.4 View (per-user, listRefs вместо listIds)

```ts
// ДО
interface View {
  id; label; kind; listIds: string[]; createdAt; updatedAt
}

// ПОСЛЕ
interface View {
  id
  workspaceId         // ← новое
  userId: string | null   // ← новое; null = legacy
  label; kind
  listRefs: ViewListRef[]   // ← заменило listIds
  createdAt; updatedAt
}

interface ViewListRef { listId: string; workspaceId: string }

interface CreateViewDto {
  label; kind
  listRefs?: ViewListRef[]   // ← вместо listIds
}

interface UpdateViewDto {
  label?; kind?
  listRefs?: ViewListRef[]   // ← вместо listIds
}
```

**Логика:**

- Каждый ref несёт пару `(listId, workspaceId)`. Для своих листов
  `workspaceId === currentWorkspaceId`. Для расшаренных — foreign.
- Бэк валидирует: для своих — что лист принадлежит ws; для чужих — что
  у юзера есть read-доступ к этому листу через share. Не прошло → `400`.
- При рендере view: для каждого ref выбирать роут по принципу из 3.2
  (свой → workspace-scoped, чужой → shared).
- **Совместимость со старыми View-документами в БД.** В монге могут
  лежать доки с заполненным `listIds` и пустым `listRefs` — это до миграции.
  Бэк прозрачно при чтении превращает их в `listRefs` (все из текущего
  workspace). Любой PATCH с `listRefs` затирает `listIds = []`. На фронте
  считай только `listRefs`, `listIds` в DTO **не возвращается**.

---

## 4. UI: «Shared with me» в сайдбаре

### 4.1 Источник данных

При входе в workspace, помимо `GET /api/workspaces/:wsId/spaces` (мои спейсы),
дёргать `GET /api/shared-spaces` (расшаренные мне). Хранить в отдельном
store `useSharedSpacesStore` (по аналогии с `useSpacesStore`). Листы
внутри уже приходят в одном ответе — отдельный fetch не нужен.

### 4.2 Структура сайдбара

```
SIDEBAR
├── Pinned                       ← из GET /pins, с маркером для foreign entity
├── My spaces
│   ├── Space "Personal"
│   │   ├── List "Inbox"
│   │   └── List "Dev"
│   └── Space "Work"
└── Shared with me               ← новая секция, рендерится только если /shared-spaces вернул не []
    ├── 🔒 Space "Hule" (от Аня <anya@…>)
    │   ├── 📝 List "api"
    │   └── 📝 List "web"
    └── ...
```

- Header «Shared with me» можно свернуть.
- Под именем space — мелким текстом owner.name или owner.email.
- Иконка 🔒 / бейдж "viewer" подчёркивают read-only.

### 4.3 Реакция на клик по shared list

URL остаётся в текущем workspace (никуда не редиректим). Открываем
панель/таблицу тасков, но source — `/api/shared-lists/:listId/tasks`.
Все мутации тасков (drag, edit, create) **отключены** для shared листа:
- input создания таска — disabled с тултипом «Read-only (shared)»;
- drag-and-drop порядка — disabled;
- статус-чекбокс — disabled (или скрыт);
- меню «…» на таске показывает только «View details», без Edit/Delete.

### 4.4 Создание share-а у себя

В контекстном меню моего space (где я owner workspace) — пункт «Share…».
Модалка:
- Поле email (валидация — стандарт).
- Дроп для role: только «Viewer» (editor задизейблен с тултипом «Coming soon»).
- Кнопка «Share» → `POST /api/spaces/:id/shares`.
- Список текущих share-ов (`space.sharedWith`) с возможностью удалить.

После успеха — обновить локальный store space (response уже содержит
актуальный `sharedWith`).

### 4.5 Создание pin/view на расшаренное

- **Pin.** В меню расшаренного листа/спейса показывать «Pin to my sidebar».
  При создании указать `entityWorkspaceId` = foreign wsId (бэк проверит).
  В рендере пинов отличать foreign по полю и подгружать имя из
  `useSharedSpacesStore`.
- **View.** В мастере создания view при выборе листов нужно показывать
  и свои, и расшаренные. Для каждого выбранного отдавать
  `{ listId, workspaceId }`. Свой ws — для своих, foreign — для расшаренных.

---

## 5. Гарантии и edge cases

| Ситуация                                          | Поведение                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| Owner удаляет space, в котором был share          | Каскад: лист'ы, таски, пины (включая foreign), refs во views — снесены |
| Owner удаляет лист                                | То же: пины и listRefs (foreign в т.ч.) автоматом подчищаются          |
| Owner удаляет workspace целиком                   | Каскад идёт по обоим направлениям (свой ws + foreign refs в чужие)     |
| B снят с share (DELETE share)                     | B перестаёт видеть space в `/shared-spaces`. Pin/View B → не чистятся (см. 2.2 ⚠️) |
| B пытается дёрнуть `/workspaces/A_ws/...` напрямую | `403` от `WorkspaceAccessGuard` — это by design                       |
| Owner workspace не A, а другой member             | Только owner workspace может share/unshare. Member-ы не могут.        |

---

## 6. Чек-лист интеграции на web

1. Обновить `@hule/types` (уже залит): новые поля в `Space`, `List`, `Pin`,
   `View`, новый `SharedSpace`. Все web-файлы, использующие
   `View.listIds`, надо переписать на `View.listRefs`.
2. Создать `useSharedSpacesStore` (по аналогии со `useSpacesStore`),
   грузить через `GET /api/shared-spaces` при входе в workspace.
3. Обновить `useSpacesStore`: после `POST /api/workspaces/:wsId/spaces` /
   `PATCH` рассчитывать на новые поля `workspaceId`, `sharedWith`.
4. Обновить `useListsStore`: новое поле `workspaceId` в `List`, использовать
   для выбора source-роута (own vs shared).
5. Перевести `pinsApi`/`viewsApi` на новые DTO (см. §3.3, §3.4).
6. Добавить секцию «Shared with me» в `AppSidebar.vue`.
7. Добавить UI Share… в меню моего space.
8. На странице расшаренного листа использовать `/api/shared-lists/:id/tasks`
   и задизейблить мутации.
9. В рендере пинов учитывать `entityWorkspaceId !== null` (foreign).
10. В мастере создания View разрешить выбирать листы из «Shared with me»
    и слать `listRefs` с правильным `workspaceId`.

---

## 7. Что НЕ входит в MVP (явные нон-цели)

- **Editor role.** Структура есть в DTO, но read-only. Не давай UI делать
  CRUD на shared контенте.
- **Sharing на уровне отдельного List** (только Space целиком).
- **Sharing с пользователями вне системы** (нужен существующий аккаунт
  с email).
- **Уведомления** о новом share-е (push, email и т.д.).
- **Каскадная очистка foreign Pin/View при unshare.** UI должен дать
  юзеру возможность удалить «битые» refs вручную (or мы доделаем потом).
- **POST/PATCH тасков на shared листе.** Любая мутация — `403`.
- **Timeline/getById/subtree на shared листе.** В MVP только flat
  `GET /api/shared-lists/:id/tasks`.

Если нужно что-то из этого — пинг.
