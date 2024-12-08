import { relations, sql } from 'drizzle-orm'
import { type AdapterAccount } from 'next-auth/adapters'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { bookSchema } from '~/lib/types/book'
import {
    index,
    integer,
    primaryKey,
    text,
    timestamp,
    varchar,
    json,
    pgSchema,
    real,
    check,
} from 'drizzle-orm/pg-core'

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
const schema = pgSchema('type-the-word')

/**
 * This database was originally generated in mysql where there is no enum construct.
 * So that is why these are defined twice.
 */
export const passageResponseBook = schema.enum(
    'passageResponse_book',
    bookSchema.options,
)
export const passageResponseTranslation = schema.enum(
    'passageResponse_translation',
    ['esv'],
)
export const typedVerseBook = schema.enum('typedVerse_book', bookSchema.options)
export const typedVerseTranslation = schema.enum('typedVerse_translation', [
    'esv',
])

export const users = schema.table('user', {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull(),
    emailVerified: timestamp('emailVerified', {
        mode: 'date',
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    image: varchar('image', { length: 255 }),
})

export const usersRelations = relations(users, ({ many, one }) => ({
    accounts: many(accounts),
    typingSessions: many(typingSessions),
    userChangelog: one(userChangelog),
    userThemes: many(userTheme),
    userCurrentTheme: one(userCurrentTheme),
}))

export const userChangelog = schema.table('userChangelog', {
    userId: varchar('userId', { length: 255 })
        .notNull()
        .$default(() => crypto.randomUUID())
        .primaryKey(),
    lastVisitedAt: timestamp('lastVisitedAt', { mode: 'date' })
        .notNull()
        .$default(() => sql`CURRENT_TIMESTAMP(3)`),
})

export const userCurrentTheme = schema.table(
    'userCurrentTheme',
    {
        userId: varchar('userId', { length: 255 }).notNull(),
        colorScheme: varchar('colorScheme', { length: 255 }).notNull(),
        lightThemeId: varchar('lightThemeId', { length: 255 }).notNull(),
        darkThemeId: varchar('darkThemeId', { length: 255 }).notNull(),
    },
    table => ({
        checkConstraint: check(
            'schemeToThemeCheck',
            sql`
        (${table.colorScheme} IS 'system' AND ${table.lightThemeId} IS NOT NULL AND ${table.darkThemeId} IS NOT NULL) OR
        (${table.colorScheme} IS 'light' AND ${table.lightThemeId} IS NOT NULL AND ${table.darkThemeId} IS NULL) OR
        (${table.colorScheme} IS 'dark' AND ${table.lightThemeId} IS NULL AND ${table.darkThemeId} IS NOT NULL)
        `,
        ),
    }),
)

export const userCurrentThemeRelations = relations(
    userCurrentTheme,
    ({ one }) => ({
        lightThemeId: one(theme),
        darkThemeId: one(theme),
    }),
)

export const userTheme = schema.table('userTheme', {
    userId: varchar('userId', { length: 255 }).notNull(),
    themeId: varchar('themeId', { length: 255 }).notNull(),
})

export const userThemeRelations = relations(userTheme, ({ one }) => ({
    user: one(users),
    theme: one(theme),
}))

export const builtinTheme = schema.table('builtinTheme', {
    themeId: varchar('themeId', { length: 255 }).notNull(),
})

export const builtinThemeRelations = relations(builtinTheme, ({ one }) => ({
    themes: one(theme),
}))

export const theme = schema.table('theme', {
    id: varchar('id', { length: 255 })
        .notNull()
        .$default(() => crypto.randomUUID())
        .primaryKey(),
    label: varchar('label', { length: 255 }).notNull(),
    primaryLightness: real('primaryLightness').notNull().default(0),
    primaryChroma: real('primaryChroma').notNull().default(0),
    primaryHue: real('primaryHue').notNull().default(0),
    secondaryLightness: real('secondaryLightness').notNull().default(0),
    secondaryChroma: real('secondaryChroma').notNull().default(0),
    secondaryHue: real('secondaryHue').notNull().default(0),
    successLightness: real('successLightness').notNull().default(0),
    successChroma: real('successChroma').notNull().default(0),
    successHue: real('successHue').notNull().default(0),
    errorLightness: real('errorLightness').notNull().default(0),
    errorChroma: real('errorChroma').notNull().default(0),
    errorHue: real('errorHue').notNull().default(0),
})

export const accounts = schema.table(
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
        userIdIdx: index('account_userId_idx').on(account.userId),
    }),
)

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessions = schema.table(
    'session',
    {
        sessionToken: varchar('sessionToken', { length: 255 })
            .notNull()
            .primaryKey(),
        userId: varchar('userId', { length: 255 }).notNull(),
        expires: timestamp('expires', { mode: 'date' }).notNull(),
    },
    session => ({
        userIdIdx: index('session_userId_idx').on(session.userId),
    }),
)

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const verificationTokens = schema.table(
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

export const typingSessions = schema.table(
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
        userIdIdx: index('typingSession_userId_idx').on(typingSession.userId),
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

export const typedVerses = schema.table(
    'typedVerse',
    {
        id: varchar('id', { length: 255 })
            .notNull()
            .$default(() => crypto.randomUUID())
            .primaryKey(),
        userId: varchar('userId', { length: 255 }).notNull(),
        typingSessionId: varchar('typingSessionId', { length: 255 }).notNull(),
        translation: typedVerseTranslation('translation').notNull(),
        book: typedVerseBook('book').notNull(),
        chapter: integer('chapter').notNull(),
        verse: integer('verse').notNull(),
        createdAt: timestamp('createdAt', { mode: 'date' })
            .notNull()
            .$default(() => sql`CURRENT_TIMESTAMP(3)`),
    },
    typedVerse => ({
        userIdIdx: index('typedVerse_userId_idx').on(typedVerse.userId),
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

export const passageResponse = schema.table('passageResponse', {
    id: varchar('id', { length: 255 })
        .notNull()
        .$default(() => crypto.randomUUID())
        .primaryKey(),
    book: passageResponseBook('book').notNull(),
    chapter: integer('chapter').notNull(),
    translation: passageResponseTranslation('translation').notNull(),
    response: json('response').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' })
        .notNull()
        .$default(() => sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
        .notNull()
        .$default(() => sql`CURRENT_TIMESTAMP(3)`),
})
