import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import multipart from '@fastify/multipart'
import { ZodError } from 'zod'
import { connectDb, closeDb, db } from './db.ts'
import { spacesRoutes } from './routes/spaces.ts'
import { listsRoutes } from './routes/lists.ts'
import { tasksRoutes } from './routes/tasks.ts'
import { commentsRoutes } from './routes/comments.ts'
import { filesRoutes } from './routes/files.ts'

const port = Number(process.env.PORT ?? 3000)

const app = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? 'info' },
})

await app.register(sensible)
await app.register(multipart, {
  limits: { fileSize: 25 * 1024 * 1024, files: 10 },
})

app.setErrorHandler((err, _req, reply) => {
  if (err instanceof ZodError) {
    return reply.code(400).send({
      error: 'ValidationError',
      issues: err.issues.map(i => ({ path: i.path, message: i.message })),
    })
  }
  app.log.error(err)
  return reply.send(err)
})

app.get('/api/health', async () => {
  const ping = await db().command({ ping: 1 })
  return { status: 'ok', mongo: ping.ok === 1 ? 'up' : 'down' }
})

await app.register(spacesRoutes)
await app.register(listsRoutes)
await app.register(tasksRoutes)
await app.register(commentsRoutes)
await app.register(filesRoutes)

async function start(): Promise<void> {
  try {
    await connectDb()
    app.log.info('mongo connected')
    await app.listen({ port, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    app.log.info(`received ${sig}, shutting down`)
    await app.close()
    await closeDb()
    process.exit(0)
  })
}

void start()
