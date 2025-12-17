import { relations, sql } from 'drizzle-orm'
import {
    index,
    integer,
    primaryKey,
    text,
    timestamp,
    varchar,
    json,
    jsonb,
    real,
    check,
    unique,
    pgEnum,
    pgTable,
} from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import { type AdapterAccount } from 'next-auth/adapters'
import { z } from 'zod'

import { bookSchema } from '~/lib/types/book'

export const passageResponseBook = pgEnum(
    'passageResponse_book',
    bookSchema.options,
)
export const passageResponseTranslation = pgEnum(
    'passageResponse_translation',
    ['esv'],
)
export const typedVerseBook = pgEnum('typedVerse_book', bookSchema.options)
export const typedVerseTranslation = pgEnum('typedVerse_translation', ['esv'])

export const users = pgTable('user', {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull(),
    emailVerified: timestamp('emailVerified', {
        mode: 'date',
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    image: varchar('image', { length: 255 }),
    hashedPassword: text('hashedPassword'),
})

export const usersRelations = relations(users, ({ many, one }) => ({
    accounts: many(accounts),
    typingSessions: many(typingSessions),
    userChangelog: one(userChangelog),
    userThemes: many(userTheme),
    userCurrentTheme: one(userCurrentTheme),
    bookProgress: many(userBookProgress),
    chapterProgress: many(userChapterProgress),
}))

export const userChangelog = pgTable('userChangelog', {
    userId: varchar('userId', { length: 255 })
        .notNull()
        .$default(() => crypto.randomUUID())
        .primaryKey(),
    lastVisitedAt: timestamp('lastVisitedAt', { mode: 'date' })
        .notNull()
        .$default(() => sql`CURRENT_TIMESTAMP(3)`),
})

export const userCurrentTheme = pgTable(
    'userCurrentTheme',
    {
        userId: varchar('userId', { length: 255 }).notNull(),
        colorScheme: varchar('colorScheme', { length: 255 }).notNull(),
        lightThemeId: varchar('lightThemeId', { length: 255 }),
        darkThemeId: varchar('darkThemeId', { length: 255 }),
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
        unique: unique().on(table.userId),
    }),
)

export const userCurrentThemeRelations = relations(
    userCurrentTheme,
    ({ one }) => ({
        lightThemeId: one(theme),
        darkThemeId: one(theme),
    }),
)

export const userTheme = pgTable(
    'userTheme',
    {
        userId: varchar('userId', { length: 255 }).notNull(),
        themeId: varchar('themeId', { length: 255 }).notNull(),
    },
    userTheme => ({
        userIdIdx: index('userTheme_userId_idx').on(userTheme.userId),
    }),
)

export const userThemeRelations = relations(userTheme, ({ one }) => ({
    user: one(users, {
        fields: [userTheme.userId],
        references: [users.id],
    }),
    theme: one(theme, {
        fields: [userTheme.themeId],
        references: [theme.id],
    }),
}))

export const builtinTheme = pgTable('builtinTheme', {
    themeId: varchar('themeId', { length: 255 }).notNull(),
})

export const builtinThemeRelations = relations(builtinTheme, ({ one }) => ({
    theme: one(theme, {
        fields: [builtinTheme.themeId],
        references: [theme.id],
    }),
}))

export const theme = pgTable('theme', {
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
        userIdIdx: index('account_userId_idx').on(account.userId),
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
        userIdIdx: index('session_userId_idx').on(session.userId),
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

export const typingDataSchema = z.object({
    userActions: z.array(
        z.object({
            type: z.enum([
                'deleteContentBackward',
                'deleteSoftLineBackward',
                'deleteWordBackward',
                'insertText',
            ]),
            key: z.string(),
            datetime: z.string(),
        }),
    ),
    userNodes: z.array(
        z.object({ type: z.literal('word'), letters: z.array(z.string()) }),
    ),
    correctNodes: z.array(
        z.object({ type: z.literal('word'), letters: z.array(z.string()) }),
    ),
})

export type TypingData = z.infer<typeof typingDataSchema>

export const typedVerses = pgTable(
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
        typingData: jsonb('typingData').$type<TypingData | null>(),
    },
    typedVerse => ({
        userIdIdx: index('typedVerse_userId_idx').on(typedVerse.userId),
        typingSessionIdUserIdIdx: index('typingSessionId_userId_idx').on(
            typedVerse.typingSessionId,
            typedVerse.userId,
        ),
        typingSessionIdIdx: index('typingSessionId_idx').on(
            typedVerse.typingSessionId,
        ),
    }),
)

export const chaptersSchema = createSelectSchema(typedVerses).shape.chapter
export type Chapter = z.infer<typeof chaptersSchema>
export const booksSchema = createSelectSchema(typedVerses).shape.book
export type Book = z.infer<typeof booksSchema>
export const translationsSchema =
    createSelectSchema(typedVerses).shape.translation
export type Translation = z.infer<typeof translationsSchema>

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

// Cache table for book-level progress (prestige + totals) per user
export const userBookProgress = pgTable(
    'userBookProgress',
    {
        userId: varchar('userId', { length: 255 }).notNull(),
        book: typedVerseBook('book').notNull(),
        translation: typedVerseTranslation('translation').notNull(),
        prestige: integer('prestige').notNull().default(0),
        typedVerseCount: integer('typedVerseCount').notNull().default(0),
        totalVerses: integer('totalVerses').notNull(),
        updatedAt: timestamp('updatedAt', { mode: 'date' })
            .notNull()
            .$default(() => sql`CURRENT_TIMESTAMP(3)`),
    },
    table => ({
        pk: primaryKey(table.userId, table.book, table.translation),
        userIdIdx: index('userBookProgress_userId_idx').on(table.userId),
    }),
)

export const userBookProgressRelations = relations(
    userBookProgress,
    ({ one, many }) => ({
        user: one(users, {
            fields: [userBookProgress.userId],
            references: [users.id],
        }),
        chapters: many(userChapterProgress),
    }),
)

// Cache table for chapter-level progress per user
export const userChapterProgress = pgTable(
    'userChapterProgress',
    {
        userId: varchar('userId', { length: 255 }).notNull(),
        book: typedVerseBook('book').notNull(),
        chapter: integer('chapter').notNull(),
        translation: typedVerseTranslation('translation').notNull(),
        typedVerses: jsonb('typedVerses')
            .notNull()
            .$type<Record<number, boolean>>()
            .default({}),
        typedVerseCount: integer('typedVerseCount').notNull().default(0),
        totalVerses: integer('totalVerses').notNull(),
        updatedAt: timestamp('updatedAt', { mode: 'date' })
            .notNull()
            .$default(() => sql`CURRENT_TIMESTAMP(3)`),
    },
    table => ({
        pk: primaryKey(
            table.userId,
            table.book,
            table.chapter,
            table.translation,
        ),
        userIdIdx: index('userChapterProgress_userId_idx').on(table.userId),
        userIdBookIdx: index('userChapterProgress_userId_book_idx').on(
            table.userId,
            table.book,
        ),
    }),
)

export const userChapterProgressRelations = relations(
    userChapterProgress,
    ({ one }) => ({
        user: one(users, {
            fields: [userChapterProgress.userId],
            references: [users.id],
        }),
        bookProgress: one(userBookProgress, {
            fields: [
                userChapterProgress.userId,
                userChapterProgress.book,
                userChapterProgress.translation,
            ],
            references: [
                userBookProgress.userId,
                userBookProgress.book,
                userBookProgress.translation,
            ],
        }),
    }),
)

export const passageResponse = pgTable('passageResponse', {
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
