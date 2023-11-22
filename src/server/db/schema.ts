import { relations, sql } from 'drizzle-orm'
import {
    index,
    int,
    mysqlEnum,
    mysqlTableCreator,
    primaryKey,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/mysql-core'
import { type AdapterAccount } from 'next-auth/adapters'

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const mysqlTable = mysqlTableCreator(name => `${name}`)

export const users = mysqlTable('user', {
    id: varchar('id', { length: 255 }).notNull().primaryKey(),
    name: varchar('name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull(),
    emailVerified: timestamp('emailVerified', {
        mode: 'date',
        fsp: 3,
    }).default(sql`CURRENT_TIMESTAMP(3)`),
    image: varchar('image', { length: 255 }),
})

export const usersRelations = relations(users, ({ many }) => ({
    accounts: many(accounts),
    typingSessions: many(typingSessions),
}))

export const accounts = mysqlTable(
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
        expires_at: int('expires_at'),
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

export const sessions = mysqlTable(
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

export const verificationTokens = mysqlTable(
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

export const typingSessions = mysqlTable(
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

export const typedVerses = mysqlTable(
    'typedVerse',
    {
        id: varchar('id', { length: 255 })
            .notNull()
            .$default(() => crypto.randomUUID())
            .primaryKey(),
        userId: varchar('userId', { length: 255 }).notNull(),
        typingSessionId: varchar('typingSessionId', { length: 255 }).notNull(),
        translation: mysqlEnum('translation', ['esv']).notNull(),
        book: mysqlEnum('book', [
            'genesis',
            'exodus',
            'leviticus',
            'numbers',
            'deuteronomy',
            'joshua',
            'judges',
            'ruth',
            '1_samuel',
            '2_samuel',
            '1_kings',
            '2_kings',
            '1_chronicles',
            '2_chronicles',
            'ezra',
            'nehemiah',
            'esther',
            'job',
            'psalm',
            'proverbs',
            'ecclesiastes',
            'song_of_solomon',
            'isaiah',
            'jeremiah',
            'lamentations',
            'ezekiel',
            'daniel',
            'hosea',
            'joel',
            'amos',
            'obadiah',
            'jonah',
            'micah',
            'nahum',
            'habakkuk',
            'zephaniah',
            'haggai',
            'zechariah',
            'malachi',
            'matthew',
            'mark',
            'luke',
            'john',
            'acts',
            'romans',
            '1_corinthians',
            '2_corinthians',
            'galatians',
            'ephesians',
            'philippians',
            'colossians',
            '1_thessalonians',
            '2_thessalonians',
            '1_timothy',
            '2_timothy',
            'titus',
            'philemon',
            'hebrews',
            'james',
            '1_peter',
            '2_peter',
            '1_john',
            '2_john',
            '3_john',
            'jude',
            'revelation',
        ]).notNull(),
        chapter: int('chapter').notNull(),
        verse: int('verse').notNull(),
        createdAt: timestamp('createdAt', { mode: 'date' })
            .notNull()
            .$default(() => sql`CURRENT_TIMESTAMP(3)`),
    },
    typedVerse => ({
        userIdIdx: index('userId_idx').on(typedVerse.userId),
    }),
)

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
