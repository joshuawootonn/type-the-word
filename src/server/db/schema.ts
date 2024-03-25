import { relations, sql } from 'drizzle-orm'
import { type AdapterAccount } from 'next-auth/adapters'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { bookSchema } from '~/lib/types/book'
import {
    index,
    integer,
    pgEnum,
    primaryKey,
    text,
    timestamp,
    varchar,
    json,
    pgTableCreator,
} from 'drizzle-orm/pg-core'

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const pgTable = pgTableCreator(name => `${name}`)

const bookEnum = pgEnum('book', bookSchema.options)
const translationEnum = pgEnum('translation', ['esv'])

export const users = pgTable('user', {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull(),
    emailVerified: timestamp('emailVerified', {
        mode: 'date',
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    image: varchar('image', { length: 255 }),
})

export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    typingSessions: many(typingSessions),
}))

export const accounts = pgTable(
    'account',
    {
        userId: varchar('userId', { length: 255 }).notNull(),
        type: varchar('type', { length: 255 })
            .$type<AdapterAccount['type']>()
            .notNull(),
        provider: varchar('provider', { length: 255 }).notNull(),
        providerAccountId: varchar('providerAccountId', {
            length: 255,
        }).notNull(),
        refresh_token: text('refresh_token'),
        access_token: text('access_token'),
        expires_at: integer('expires_at'),
        token_type: varchar('token_type', { length: 255 }),
        scope: varchar('scope', { length: 255 }),
        id_token: text('id_token'),
        session_state: varchar('session_state', { length: 255 }),
    },
    account => ({
        compoundKey: primaryKey(account.provider, account.providerAccountId),
        userIdIdx: index('userId_idx').on(account.userId),
    }),
)

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessions = pgTable(
    'session',
    {
        sessionToken: varchar('sessionToken', { length: 255 })
            .notNull()
            .primaryKey(),
        userId: varchar('userId', { length: 255 }).notNull(),
        expires: timestamp('expires', { mode: 'date' }).notNull(),
    },
    session => ({
        userIdIdx: index('userId_idx').on(session.userId),
    }),
)

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const verificationTokens = pgTable(
    'verificationToken',
    {
        identifier: varchar('identifier', { length: 255 }).notNull(),
        token: varchar('token', { length: 255 }).notNull(),
        expires: timestamp('expires', { mode: 'date' }).notNull(),
    },
    vt => ({
        compoundKey: primaryKey(vt.identifier, vt.token),
    }),
)

export const typingSessions = pgTable(
    'typingSession',
    {
        id: varchar('id', { length: 255 })
            .notNull()
            .$default(() => crypto.randomUUID())
            .primaryKey(),
        userId: varchar('userId', { length: 255 }).notNull(),
        createdAt: timestamp('createdAt', { mode: 'date' })
            .notNull()
            .$default(() => sql`CURRENT_TIMESTAMP(3)`),
        updatedAt: timestamp('updatedAt', { mode: 'date' })
            .notNull()
            .$default(() => sql`CURRENT_TIMESTAMP(3)`),
    },
    typingSession => ({
        userIdIdx: index('userId_idx').on(typingSession.userId),
    }),
)

export const typingSessionRelations = relations(
    typingSessions,
    ({ one, many }) => ({
        user: one(users, {
            fields: [typingSessions.userId],
            references: [users.id],
        }),
        typedVerses: many(typedVerses),
    }),
)

export const typedVerses = pgTable(
    'typedVerse',
    {
        id: varchar('id', { length: 255 })
            .notNull()
            .$default(() => crypto.randomUUID())
            .primaryKey(),
        userId: varchar('userId', { length: 255 }).notNull(),
        typingSessionId: varchar('typingSessionId', { length: 255 }).notNull(),
        translation: translationEnum('translation').notNull(),
        book: bookEnum('book').notNull(),
        chapter: integer('chapter').notNull(),
        verse: integer('verse').notNull(),
        createdAt: timestamp('createdAt', { mode: 'date' })
            .notNull()
            .$default(() => sql`CURRENT_TIMESTAMP(3)`),
    },
    typedVerse => ({
        userIdIdx: index('userId_idx').on(typedVerse.userId),
        typingSessionIdUserIdIdx: index('typingSessionId_userId_idx').on(
            typedVerse.typingSessionId,
            typedVerse.userId,
        ),
    }),
)

export const chaptersSchema = createSelectSchema(typedVerses).shape.chapter
export type Chapter = z.infer<typeof chaptersSchema>
export const booksSchema = createSelectSchema(typedVerses).shape.book
export type Book = z.infer<typeof booksSchema>

export const typedVerseRelations = relations(typedVerses, ({ one }) => ({
    user: one(users, {
        fields: [typedVerses.userId],
        references: [users.id],
    }),
    typingSession: one(typingSessions, {
        fields: [typedVerses.typingSessionId],
        references: [typingSessions.id],
    }),
}))

export const passageResponse = pgTable('passageResponse', {
    id: varchar('id', { length: 255 })
        .notNull()
        .$default(() => crypto.randomUUID())
        .primaryKey(),
    book: bookEnum('book').notNull(),
    chapter: integer('chapter').notNull(),
    translation: translationEnum('translation').notNull(),
    response: json('response').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' })
        .notNull()
        .$default(() => sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
        .notNull()
        .$default(() => sql`CURRENT_TIMESTAMP(3)`),
})
