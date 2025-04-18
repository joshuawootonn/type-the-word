import { db } from "../server/db";
import { typedVerses, typingSessions, users } from "../server/db/schema";
import { User, UserRepository } from "../server/repositories/user.repository";

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { TypedVerse, TypingSession, TypingSessionRepository } from "~/server/repositories/typingSession.repository";
import { TypedVerseRepository } from "~/server/repositories/typedVerse.repository";
import { Sema } from 'async-sema';
import { chunk } from "~/lib/chunk";
// enum TestPersona {
//     janet = 'janet',
// }



export async function truncateTables() {
    await db.delete(typingSessions).execute();
    await db.delete(typedVerses).execute();
    await db.delete(users).execute();
}

export async function createUser(): Promise<User> {
    const userRepository = new UserRepository(db);
    const _user = await userRepository.db.insert(users).values({
        id: crypto.randomUUID(),
        email: 'test@test.com',
        name: 'Test User',
    }).returning();
    const user = _user[0]!;

    if (!user) {
        throw new Error('Failed to create user');
    }

    // Read and parse the CSV file
    const typedSessionsCsv = fs.readFileSync(
        path.join(__dirname, './personas/janet/typingSessions.csv'),
        'utf-8'
    );
    const sessions: TypingSession[] = parse(typedSessionsCsv, {
        columns: true,
        skip_empty_lines: true
    });

    console.log(`Inserting ${sessions.length} typing sessions`)

    // Insert each session
    const typingSessionRepository = new TypingSessionRepository(db);
    const sema = new Sema(3);
    const chunkSize = 5000;
    await Promise.all(
        chunk(sessions, chunkSize).map(async (sessionChunk, index: number) => {
            await sema.acquire();
            try {
                await typingSessionRepository.db.insert(typingSessions).values(sessionChunk.map((session) => ({
                    id: session.id,
                    createdAt: new Date(session.createdAt),
                    updatedAt: new Date(session.updatedAt),
                    userId: user.id,
                })));
            } finally {
                console.log(`Inserted ${index * chunkSize} typing sessions`)

                sema.release();
            }
        })
    );

    // Read and parse the CSV file for typed verses
    const typedVersesCsv = fs.readFileSync(
        path.join(__dirname, './personas/janet/typedVerses.csv'),
        'utf-8'
    );
    const verses: TypedVerse[] = parse(typedVersesCsv, {
        columns: true,
        skip_empty_lines: true
    });

    console.log(`Inserting ${verses.length} typed verses`)

    // Insert each typed verse
    const typedVerseRepository = new TypedVerseRepository(db);
    await Promise.all(
        chunk(verses, chunkSize).map(async (verseChunk, index: number) => {
            await sema.acquire();
            try {
                const typedVersesData = verseChunk.map((verse) => ({
                    ...verse as TypedVerse,
                    createdAt: new Date(verse.createdAt),
                    userId: user.id,
                }))

                await typedVerseRepository.db.insert(typedVerses).values(typedVersesData);
            } finally {

                    console.log(`Inserted ${index * chunkSize} typed verses`)

                sema.release();
            }
        })
    );

    return user;
}
