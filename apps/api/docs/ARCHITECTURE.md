# Архитектура backend-приложения Hule

> Лёгкая архитектура по образцу DealDuck `ARCHITECTURE.base.md` — только общий
> подход, без инфраструктуры (Docker/Compose), без тестирования. NestJS 11 +
> Fastify + MongoDB (Mongoose) + GridFS для вложений.

---

## 1. TL;DR — одна картинка

```
apps/api/src/
├── main.ts                          ← entry point, ничего не знает о Nest
├── apps/
│   └── rest-api.app.ts              ← bootstrap класс (builder-style)
├── adapters/                        ← всё что "смотрит наружу" или "подключается наружу"
│   ├── rest-api/                    ← HTTP входные точки (controllers + модули)
│   │   ├── rest-api.module.ts       ← корень HTTP композиции
│   │   ├── filters/                 ← AllExceptionsFilter
│   │   ├── pipes/                   ← validationExceptionFactory
│   │   └── <feature>/
│   │       ├── rest-api-<feature>.controller.ts
│   │       └── rest-api-<feature>.module.ts
│   ├── mongo/                       ← схемы Mongoose (и только схемы)
│   │   └── <entity>.schema.ts
│   └── gridfs/                      ← обёртка над GridFSBucket для вложений
│       ├── gridfs.module.ts
│       └── gridfs.service.ts
└── domain/                          ← бизнес-логика
    ├── entity/
    │   ├── common/                  ← общие DTO (IdParams, ReorderItem)
    │   └── <feature>/
    │       ├── <feature>.dto.ts
    │       ├── create-<feature>.dto.ts
    │       ├── update-<feature>.dto.ts
    │       └── <feature>.constants.ts
    └── modules/
        └── <feature>/
            ├── <feature>.module.ts
            └── <feature>.service.ts
```

Принцип: **adapter'ы зависят от domain, но не наоборот**. Единственное
исключение — схемы Mongoose лежат в `adapters/mongo/`, но `domain/modules/*`
их импортируют. Это сознательный прагматизм ради краткости: иначе пришлось бы
держать репозитории и абстракции. В маленьком сервисе это не окупается.

---

## 2. Стек

| Слой                | Выбор                               | Почему                                                                 |
|---------------------|-------------------------------------|------------------------------------------------------------------------|
| Фреймворк           | **NestJS 11**                       | DI + декораторы + модули → предсказуемая структура                     |
| HTTP                | **Fastify** (`@nestjs/platform-fastify`) | Быстрее Express, совместимость с Nest почти 100%                      |
| DB                  | **MongoDB + @nestjs/mongoose**      | Документная модель, schemas-as-classes                                 |
| Файлы               | **GridFS** (через `mongodb` driver поверх Mongoose connection) | Вложения к комментариям живут в той же базе, без отдельного стораджа   |
| Валидация           | `class-validator` + `ValidationPipe` | Валидация через декораторы на DTO, ноль ручного кода                   |
| Документация        | `@nestjs/swagger`                   | OpenAPI генерится из тех же DTO                                        |
| Multipart           | `@fastify/multipart`                | Потоковый аплоад вложений прямо в GridFS                               |
| Exception handling  | Собственный `AllExceptionsFilter`   | Сохраняем формат `{error:'ValidationError', issues:[...]}`             |

> Зависимости в `dependencies` package.json — только то, что нужно в продакшене.
> `@nestjs/cli`, `ts-node`, `tsconfig-paths` и сборочные инструменты — в
> `devDependencies`.

---

## 3. Точка входа и bootstrap

### 3.1 `main.ts` — тонкий entry point

```ts
// src/main.ts
import { RestApiApp } from './apps/rest-api.app';

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

RestApiApp.bootstrap();
```

**Почему так:**
- `main.ts` не знает про Nest. Он знает только про `App`. Если завтра появится
  второе приложение (worker, CLI, gRPC) — добавляется ещё один класс в `apps/`
  и один файл-entry, остальной код не меняется.
- `process.exit(1)` на unhandled — осознанный выбор. Живём с предположением,
  что Docker/Compose поднимет контейнер заново.

### 3.2 `rest-api.app.ts` — builder-style bootstrap

```ts
export class RestApiApp {
    PORT = Number(process.env.PORT ?? 3000);
    BASE_PATH = process.env.BASE_PATH ?? 'api';
    app!: NestFastifyApplication;

    static async bootstrap() {
        await (await new RestApiApp().init())
            .useMultipart()
            .usePipes()
            .useFilters()
            .useCors()
            .useDocumentation()
            .listen();
    }

    async init() { /* NestFactory.create + setGlobalPrefix + enableShutdownHooks */ return this; }
    coreModule() { return RestApiModule; }
    async useMultipart() { /* register @fastify/multipart */ return this; }
    usePipes() { /* ValidationPipe(whitelist, transform, exceptionFactory) */ return this; }
    useFilters() { /* AllExceptionsFilter */ return this; }
    useCors() { /* enableCors */ return this; }
    useDocumentation() { /* SwaggerModule */ return this; }
    async listen() { /* app.listen */ return this; }
}
```

**Что здесь хорошо и надо держать так:**

1. **Класс, а не функция.** В отличие от дефолтного `async function bootstrap()`
   из шаблона Nest, здесь — именованный класс с методами. Легко переопределить
   конкретный шаг в наследнике.
2. **Каждый шаг — отдельный метод, возвращающий `this`.** Это _builder_. Читается
   как декларация: "подключи multipart, пайпы, фильтры, cors, доки…".
3. **`coreModule()` — виртуальный метод.** Подменить корневой модуль в дочернем
   приложении — одна строка.
4. **Глобальные пайпы/фильтры** применяются здесь, а не в root-модуле через
   `APP_PIPE`. Видишь пайплайн целиком.
5. **`setGlobalPrefix('api')` + `BASE_PATH`** — единая точка, где задан префикс.
   Контроллеры не дублируют `/api/*` в своих `@Controller()`.

**Ключевые настройки:**
```ts
new ValidationPipe({
    whitelist: true,    // отрезать поля, которых нет в DTO
    transform: true,    // применять class-transformer
    exceptionFactory: validationExceptionFactory,
});
```
`whitelist: true` + `transform: true` — де-факто обязательный минимум для REST.

Fastify поднимаем с увеличенным `maxParamLength: 1000`, как у референса:
дефолт в 100 символов легко ломает длинные `:id` и query-параметры.

---

## 4. Слои подробно

### 4.1 `adapters/mongo/` — только схемы, ничего больше

```ts
// task.schema.ts
@Schema({ collection: 'tasks', timestamps: true })
export class Task {
    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'List' })
    listId: mongoose.Types.ObjectId;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null })
    parentId: mongoose.Types.ObjectId | null;

    @Prop({ required: true }) title: string;
    @Prop({ required: true, default: 'todo' }) status: string;

    @Prop({
        required: true,
        type: String,
        enum: Object.values(ETaskPriority),
        default: ETaskPriority.None,
    })
    priority: ETaskPriority;

    @Prop({
        required: true,
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
        default: [],
    })
    path: Array<mongoose.Types.ObjectId>;

    // depth, order, startDate, dueDate, description — опущены для краткости
}

export type TaskDocument = Task & Document;
export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ listId: 1, parentId: 1, order: 1 });
TaskSchema.index({ path: 1 });
TaskSchema.index({ startDate: 1, dueDate: 1 });
```

**Правила:**
- **Одна папка, один файл на схему.** Никаких сервисов/репозиториев в `mongo/`.
- **`timestamps: true`** — почти всегда нужен; добавляет `createdAt`/`updatedAt`.
  Для `Comment` — только `createdAt`: `timestamps: { createdAt: true, updatedAt: false }`.
- **Связи через `ObjectId` + `ref`**, а не embedded docs. Исключение —
  `CommentAttachment` внутри `Comment`: маленький неизменяемый поддокумент
  без отдельной коллекции.
- **Вложенные объекты без `_id`** — `@Schema({ _id: false })` (см. `CommentAttachment`).
- **Enum-ы живут в `domain/entity/<feature>/*.constants.ts`**, а не в схеме.
  Схема их импортирует. Это единственная зависимость `adapters → domain`,
  и она обратима: enum — часть доменной модели.
- **Индексы через `XSchema.index({...})`** — ровно те, что нужны под конкретные
  query-паттерны сервисов. Таблица Task опирается на материализованный `path`,
  отсюда индекс `{ path: 1 }` для `find({ path: oid })`.

### 4.2 `domain/entity/<feature>/*.dto.ts` — три DTO на каждую сущность

Паттерн _создать/обновить/прочитать_ + опциональные проекции.

**`CreateXDto`** — принимает клиентский ввод:
```ts
export class CreateTaskDto {
    @ApiProperty() @IsMongoId() @IsNotEmpty()
    listId: string;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @ValidateIf((_o, v) => v !== null && v !== undefined)
    @IsMongoId()
    parentId?: string | null;

    @ApiProperty() @IsString() @IsNotEmpty() @MinLength(1) @MaxLength(500)
    title: string;

    @ApiProperty({ required: false, enum: ETaskPriority, default: ETaskPriority.None })
    @IsEnum(ETaskPriority) @IsOptional()
    priority?: ETaskPriority = ETaskPriority.None;
    // …
}
```

**`UpdateXDto`** — все поля `@IsOptional()`, плюс `null` для сброса значения:
```ts
export class UpdateTaskDto {
    @ApiProperty({ required: false }) @IsString() @IsOptional() @MinLength(1) @MaxLength(500)
    title?: string;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @ValidateIf((_o, v) => v !== null && v !== undefined)
    @IsString() @MaxLength(20000)
    description?: string | null;
    // …
}
```
`@ValidateIf((_, v) => v !== null && v !== undefined)` перед строгими
декораторами — приём для «или значение валидное, или `null`». Без него
`null` не пройдёт `@IsString()`, но нам `null` нужен, чтобы сделать `$unset`
в Mongo.

**`XDto`** — DTO для **чтения**. Два ключевых приёма:

1. **Конструктор принимает `Dto | any`** — может мапить **и из Mongoose-документа,
   и из plain JS-объекта**. Внутри — ручное присваивание полей. Типичный
   паттерн — нормализация `_id` → `id` и `Date` → ISO:
   ```ts
   this.id = raw?._id?.toString() ?? raw?.id?.toString();
   this.createdAt = raw?.createdAt instanceof Date
     ? raw.createdAt.toISOString()
     : raw?.createdAt;
   ```
2. **Массивы ObjectId сериализуются вручную:**
   ```ts
   this.path = Array.isArray(raw?.path) ? raw.path.map(p => p.toString()) : [];
   ```

**Почему не `class-transformer` `@Expose`?**
- Ручная мапа — предсказуема. Видно, что мапится и как.
- Не надо бороться с `plainToInstance` и типами на каждом шагу.
- Можно трансформировать по-разному для одного источника: populate/без populate,
  вложенные DTO без магии декораторов.

**Query-DTO.** Любой `@Query()` — отдельный класс с валидацией:
`TasksListQueryDto`, `TimelineQueryDto`, `ListsQueryDto`. Не «сырой»
`Record<string, string>`.

### 4.3 `domain/modules/<feature>/<feature>.service.ts` — бизнес-логика

```ts
@Injectable()
export class TaskService {
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>;
    @InjectModel(Comment.name) private commentModel: Model<Comment>;
    @InjectModel(List.name) private listModel: Model<List>;

    async getById(id: string): Promise<TaskDto> {
        const doc = await this.taskModel.findById(toOid(id));
        if (!doc) throw new NotFoundException('Task not found');
        return new TaskDto(doc);
    }

    async create(dto: CreateTaskDto) {
        const list = await this.listModel.findById(toOid(dto.listId));
        if (!list) throw new BadRequestException('List not found');
        // вычисляем path/depth от parent, next order — см. исходник
        const doc = await this.taskModel.create({ /* … */ });
        return new TaskDto(doc);
    }
}
```

**Конвенции сервиса:**
1. **Field-injection на моделях** (`@InjectModel(...) private model: Model<...>`).
   Короче, и Nest с этим работает корректно. Межсервисные зависимости —
   через конструктор (см. `ListService(private readonly taskService: TaskService)`).
2. **Возвращаем DTO, не Mongoose-документ.** Никогда из сервиса не утекает
   `Document`/`Model`.
3. **`raw && new Dto(raw)` или `?.map(...) ?? []`** — защита от `null`/`undefined`
   без `if`-портянки.
4. **Доменные инварианты на входе** — `throw new BadRequestException(...)`
   или `NotFoundException`. Фильтр превратит в корректный HTTP-ответ.
5. **Любая зависимость на другой сервис — через DI и модульный `exports`**:
   ```ts
   constructor(private readonly taskService: TaskService) {}
   ```
   Никогда не импортировать сервис напрямую, минуя модуль.

### 4.4 `domain/modules/<feature>/<feature>.module.ts` — паттерн "feature-module"

```ts
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Task.name, schema: TaskSchema },
            { name: Comment.name, schema: CommentSchema },
            { name: List.name, schema: ListSchema },
        ]),
    ],
    providers: [TaskService],
    exports: [TaskService],
})
export class TaskModule {}
```

**Правило:** каждый domain-модуль:
- импортирует `MongooseModule.forFeature(...)` со **всеми нужными ему
  моделями** (Task тянет ещё Comment и List — для каскадного удаления и
  валидации ссылок, это оправдано);
- экспортирует **только свой сервис** (не модель);
- не содержит контроллеров.

Если сервису A нужен сервис B — модуль A импортирует модуль B:
```ts
// list.module.ts — ListService вызывает TaskService для каскада
imports: [
    MongooseModule.forFeature([...]),
    TaskModule,
]
```

**Каскад Space → List → Task решается через цепочку сервисов:**
`SpaceService.delete` → `ListService.deleteBySpaceId` → `TaskService.deleteByListIds`.
Каждый слой знает только про соседний. Обратных импортов нет, `forwardRef`
ни разу не понадобился.

### 4.5 `adapters/rest-api/<feature>/` — HTTP-адаптер

**Контроллер — тонкий:**
```ts
@ApiTags('Task')
@Controller('tasks')
export class RestApiTaskController {
    @Inject() taskService: TaskService;

    @ApiResponse({ type: [TaskDto] })
    @Get()
    getByList(@Query() query: TasksListQueryDto): Promise<Array<TaskDto>> {
        return this.taskService.getByListQuery(query);
    }

    @ApiResponse({ type: TaskDto })
    @Post()
    create(@Body() dto: CreateTaskDto): Promise<TaskDto> {
        return this.taskService.create(dto);
    }

    @Post(':id/move')
    @HttpCode(204)
    async move(@Param() params: IdParamsDto, @Body() dto: MoveTaskDto) {
        await this.taskService.move(params.id, dto);
    }
}
```

**Правила:**
- Контроллер ничего не знает про Mongoose. Принимает DTO, зовёт сервис,
  возвращает DTO.
- `@ApiTags(...)` раз, `@ApiResponse({ type: XDto })` — на каждом методе.
  Это даёт корректную Swagger-спеку без единой лишней строчки.
- 204 для операций без тела — `@HttpCode(204)` явно.
- Никаких `try/catch`. Ошибки летят в глобальный фильтр.
- Для bare-array body (`POST /spaces/reorder` — массив элементов) —
  `@Body(new ParseArrayPipe({ items: ReorderItemDto, whitelist: true }))`.
  ParseArrayPipe валидирует каждый элемент через class-validator.

**REST-модуль фичи:**
```ts
@Module({
    imports: [TaskModule],
    controllers: [RestApiTaskController],
})
export class RestApiTaskModule {}
```
Только `imports` + `controllers`. Ни одного провайдера. Это чистый адаптер.

### 4.6 `adapters/rest-api/rest-api.module.ts` — root композиция

```ts
@Module({
    imports: [
        MongooseModule.forRoot(process.env.MONGO_URL ?? 'mongodb://mongo:27017/hule'),

        RestApiHealthModule,
        RestApiSpaceModule,
        RestApiListModule,
        RestApiTaskModule,
        RestApiCommentModule,
        RestApiFileModule,
    ],
})
export class RestApiModule {}
```

- Одно и только одно подключение к базе — здесь, через `forRoot`.
- Каждый feature-rest-module импортируется явно — один взгляд на файл и
  понятно, что умеет сервис.

### 4.7 `adapters/gridfs/` — вложения

```ts
@Injectable()
export class GridfsService implements OnModuleInit {
    private bucketInstance: GridFSBucket | null = null;

    constructor(@InjectConnection() private readonly connection: Connection) {}

    onModuleInit() {
        this.bucketInstance = new GridFSBucket(this.connection.db as any, {
            bucketName: 'attachments',
        });
    }

    upload(filename: string, mime: string, buffer: Buffer): Promise<ObjectId> {
        return new Promise((resolve, reject) => {
            const s = this.bucket().openUploadStream(filename, { contentType: mime });
            Readable.from(buffer).pipe(s).on('error', reject).on('finish', () => resolve(s.id as ObjectId));
        });
    }

    openDownloadStream(id: ObjectId) { return this.bucket().openDownloadStream(id); }
    async delete(id: ObjectId) { try { await this.bucket().delete(id); } catch {} }
}
```

**Почему GridFS, а не диск/S3:**
- Одна база на весь сервис, никакого отдельного стораджа в локальной разработке.
- `bucketName: 'attachments'` → коллекции `attachments.files` и `attachments.chunks`.
- Соединение одно и то же, что у Mongoose; хук `onModuleInit` поднимает
  `GridFSBucket` поверх уже открытого `connection.db`.

Потоковый upload из multipart идёт прямо в GridFS — промежуточный буфер
собирается в `CommentService.createForTask` из `part.file` и передаётся
в `GridfsService.upload`. Download — стрим обратно в `reply.send(stream)`.

---

## 5. Внешние интеграции

У Hule сейчас нет внешних API (SaaS, Telegram, e-mail). Если понадобится —
паттерн из референса: свой модуль-обёртка, инжект `HttpService` из
`@nestjs/axios`, `firstValueFrom` для `Observable → Promise`, `onModuleInit`
чтобы на старте привести внешнее состояние в известный вид.

---

## 6. Конкретные best practices

### 6.1 Null-safe маппинг
```ts
const doc = await this.model.findById(id);
if (!doc) throw new NotFoundException('Task not found');
return new TaskDto(doc);
```
Для не-фатального "может и не быть":
```ts
return (docs ?? []).map(d => new TaskDto(d));
```

### 6.2 `$unset` для сбрасываемых полей в UpdateDto
UpdateDto допускает `null` у некоторых полей (`description`, `startDate`,
`dueDate`) — это сигнал «обнули в базе». В `TaskService.update` собираем
`$set`/`$unset` раздельно:
```ts
for (const [k, v] of Object.entries(patch)) {
    if (v === null) $unset[k] = '';
    else if (v !== undefined) {
        if (k === 'startDate' || k === 'dueDate') $set[k] = new Date(v as string);
        else $set[k] = v;
    }
}
```
Без `$unset` поле останется со старым значением или в виде `null` — оба
варианта плохи для индексов `startDate`/`dueDate`.

### 6.3 Константы и enum-ы в `<feature>.constants.ts`
```ts
// task.constants.ts
export enum ETaskPriority {
    None = 'none',
    Low = 'low',
    Normal = 'normal',
    High = 'high',
    Urgent = 'urgent',
}
```
Префикс `E` для enum — сигнал на уровне имени.
Значения — строковые, совпадают с ключом (удобно для Mongo-хранения и для
логов). Никогда `0, 1, 2` — числовые enum-ы в БД зло.

### 6.4 Материализованный путь у Task
У каждой задачи хранится `path: ObjectId[]` — список предков от корня и
`depth: number`. Это позволяет:
- `GET /tasks/:id/subtree` — одним запросом `find({ path: oid })`.
- `POST /tasks/:id/move` — при смене родителя достаточно пересчитать `path`
  у потомков (`bulkWrite`), а не переустанавливать дерево рекурсивно.

Плата: две проверки при `move` — задача не может быть своим родителем и не
может оказаться под собственным потомком (`parent.path.some(p => p === oid)`).
Обе — в `TaskService.move`, под `throw new BadRequestException`.

### 6.5 Domain-валидация на входе в сервис
```ts
async create(dto: CreateTaskDto) {
    const list = await this.listModel.findById(toOid(dto.listId));
    if (!list) throw new BadRequestException('List not found');
    // …
}
```
class-validator ловит формат HTTP-входа, но сервисы могут звать и из
других сервисов (`ListService.delete` → `TaskService.deleteByListIds`) —
там нет пайпа. Поэтому ключевые инварианты дублируются в сервисе.

### 6.6 Fastify, а не Express
```ts
NestFactory.create<NestFastifyApplication>(
    this.coreModule(),
    new FastifyAdapter({ maxParamLength: 1000 }),
);
```
`maxParamLength: 1000` — дефолт Fastify в 100 ломает длинные URL.
`@fastify/multipart` регистрируется на raw instance через
`app.getHttpAdapter().getInstance().register(...)`.

---

## 7. Обработка ошибок и валидация

### 7.1 Глобально
```ts
useFilters() {
    this.app.useGlobalFilters(new AllExceptionsFilter());
    return this;
}
```
`AllExceptionsFilter`:
- `HttpException` с payload-объектом, содержащим `error` — пробрасываем как
  есть. Это наш формат `{ error: 'ValidationError', issues: [...] }`.
- `HttpException` без `error` в payload — обёртываем в
  `{ error: name, message }`.
- Всё остальное (`Error`) — 500 `{ error: 'InternalServerError', message }`
  + `Logger.error`.

### 7.2 Валидационные ошибки
`validationExceptionFactory` в `adapters/rest-api/pipes/`:
```ts
export function validationExceptionFactory(errors: ValidationError[]) {
    return new BadRequestException({
        error: 'ValidationError',
        issues: flatten(errors),   // [{path: ['name'], message: '…'}]
    });
}
```
Формат `{ error: 'ValidationError', issues: [{path, message}] }` сохранён
ровно таким же, как в прошлой ручной реализации на Zod — это контракт с
web-клиентом.

### 7.3 В контроллере
**Никогда не try/catch в контроллере.** Ошибка летит в глобальный фильтр.

### 7.4 В сервисе
**Валидация инвариантов** — `throw new NotFoundException(...)` /
`throw new BadRequestException(...)`. Фильтр превратит в HTTP-ответ.

### 7.5 Fatal failures → restart
`main.ts` слушает `unhandledRejection`/`uncaughtException` и делает
`process.exit(1)`. Не пытаемся _восстановиться внутри процесса_ — контейнер
поднимется заново.

---

## 8. Карта зависимостей модулей

```
RestApiModule
├── MongooseModule.forRoot
├── RestApiHealthModule
├── RestApiSpaceModule → SpaceModule
│                        ├── ListModule
│                        │   └── TaskModule
│                        └── (Space, List schemas)
├── RestApiListModule  → ListModule
├── RestApiTaskModule  → TaskModule
├── RestApiCommentModule → CommentModule
│                           ├── GridfsModule
│                           └── (Comment, Task schemas)
└── RestApiFileModule   → FileModule
                          └── GridfsModule
```

Правила:
- Нет цикличных импортов (`forwardRef` ни разу не пригодился).
- Каждый domain-модуль экспортирует **только сервис** (не модель, не схему).
- Каждый REST-модуль — только `imports` + `controllers`, без провайдеров.

---

## 9. Конфигурация TypeScript

### 9.1 tsconfig — важные флаги
```json
{
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "ES2023",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strictNullChecks": true,
    "noImplicitAny": false,
    "sourceMap": true,
    "outDir": "dist"
}
```
- `emitDecoratorMetadata` + `experimentalDecorators` — **обязательны** для Nest DI.
- `module: commonjs` — Nest-CLI (через tsc) ожидает CJS.
- `strictNullChecks: true` но `noImplicitAny: false` — прагматичный компромисс
  для быстрого MVP: null-безопасность держим, а `any` разрешаем в местах,
  где возиться с типами дольше, чем реально написать.

### 9.2 nest-cli.json
```json
{
    "collection": "@nestjs/schematics",
    "sourceRoot": "src",
    "compilerOptions": { "deleteOutDir": true }
}
```

---

## 10. Что можно улучшить при росте

1. **Конфиг через `@nestjs/config`**, а не прямой `process.env.*` в
   `RestApiModule.forRoot` и `rest-api.app.ts`. Сейчас россыпь
   `process.env.X ?? 'default'` — норм для одного проекта, плохо
   масштабируется.
2. **Валидация env** (Joi/Zod) — падать на старте, если переменная не задана,
   вместо того чтобы жить с `undefined`.
3. **Health-check через `@nestjs/terminus`** — если появится деплой
   со scale-to-zero.
4. **Логи в JSON** (pino как замена встроенному `Logger`) — structured
   logging в продакшене.
5. **Репозиторный слой** (опционально): если проект вырастет — `XRepository`
   между сервисом и моделью. Пока overkill.
6. **Доменные исключения** (`TaskNotFoundException extends NotFoundException`).
   Лучше ловятся глобальным фильтром, лучше логируются.
7. **Отдельный хранилище для вложений** (S3/MinIO) — если объём данных
   вырастет за пределы удобного GridFS.

---

## 11. Чек-лист для старта нового проекта в этом стиле

- [ ] `src/main.ts` — только `App.bootstrap()` + `process.on('unhandled*')`.
- [ ] `src/apps/<thing>.app.ts` — builder со статическим `bootstrap()`.
- [ ] `src/adapters/rest-api/rest-api.module.ts` — единственная точка, где
      `MongooseModule.forRoot` и список feature-модулей.
- [ ] `src/adapters/mongo/*.schema.ts` — только схемы, никакой логики.
- [ ] `src/domain/entity/<feature>/` — три DTO (`create`, `update`, read) + `constants`.
- [ ] `src/domain/modules/<feature>/` — `module` + `service`, service возвращает
      DTO, инжектит модель через `@InjectModel`.
- [ ] `src/adapters/rest-api/<feature>/` — тонкий controller + модуль без
      провайдеров.
- [ ] `@ApiTags` / `@ApiProperty` / `@ApiResponse` на каждом публичном эндпоинте.
- [ ] `ValidationPipe({ whitelist: true, transform: true, exceptionFactory })` глобально.
- [ ] Собственный `AllExceptionsFilter` (или аналог) — глобальный фильтр.
- [ ] Swagger на `${BASE_PATH}/documentation`.
- [ ] `setGlobalPrefix(BASE_PATH)` — единственная точка, где задан префикс.
- [ ] `strictNullChecks: true`, `emitDecoratorMetadata: true`.

---

## 12. Сжатый ответ "как это устроено в одном абзаце"

NestJS (Fastify) + MongoDB (Mongoose) + GridFS. Код разбит на три слоя:
`apps/` (bootstrap), `adapters/` (HTTP, Mongo-схемы, GridFS), `domain/`
(DTO + сервисы). Каждая фича — пара "domain-модуль (`XModule` + `XService` +
3 DTO) + rest-api-модуль (`RestApiXController` + `RestApiXModule`)". Валидация
через `class-validator` на DTO, Swagger генерируется автоматически. Материализованный
путь (`path: ObjectId[]`) у задач позволяет дешево доставать поддеревья и
перемещать ветви через `bulkWrite`. Ошибки ловит глобальный
`AllExceptionsFilter`, сохраняя исторический формат
`{ error: 'ValidationError', issues: [...] }`; фатальные падают через
`process.exit(1)` на рестарт процесса. Вложения к комментариям идут
потоком через `@fastify/multipart` в GridFS, скачиваются обратно стримом.
