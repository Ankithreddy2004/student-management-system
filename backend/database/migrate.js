const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const pool = db.promise();


// ==========================================
// SPLIT SQL FILE INTO STATEMENTS
// ==========================================

function splitSQL(content) {

    let delimiter = ';';
    let buffer = '';

    const statements = [];

    for (const line of content.split(/\r?\n/)) {

        const trimmed = line.trim();

        const delimiterMatch =
            trimmed.match(/^DELIMITER\s+(\S+)$/i);

        if (delimiterMatch) {

            if (buffer.trim()) {
                throw new Error('Incomplete SQL statement.');
            }

            delimiter = delimiterMatch[1];

            continue;
        }

        if (
            !buffer.trim() &&
            (
                !trimmed ||
                trimmed.startsWith('--') ||
                trimmed.startsWith('#')
            )
        ) {
            continue;
        }

        buffer += line + '\n';

        if (buffer.trimEnd().endsWith(delimiter)) {

            const statement = buffer
                .trim()
                .slice(0, -delimiter.length)
                .trim();

            if (statement) {
                statements.push(statement);
            }

            buffer = '';
        }

    }

    if (buffer.trim()) {
        throw new Error('Missing SQL delimiter.');
    }

    return statements;

}


// ==========================================
// RUN DATABASE MIGRATION
// ==========================================

async function migrate() {

    try {

        console.log('Starting database migration...');

        const [database] = await pool.query(
            'SELECT DATABASE() AS db_name'
        );

        if (
            database[0].db_name !== 'student_management'
        ) {
            throw new Error('Incorrect database selected.');
        }

        const proceduresPath = path.join(
            __dirname,
            'procedures'
        );

        const files = fs.readdirSync(proceduresPath)
            .filter(file => file.endsWith('.sql'))
            .sort();

        if (files.length === 0) {
            throw new Error('No SQL files found.');
        }

        for (const file of files) {

            console.log(`Processing: ${file}`);

            const filePath = path.join(
                proceduresPath,
                file
            );

            const content = fs.readFileSync(
                filePath,
                'utf8'
            );

            const statements = splitSQL(content);

            for (const statement of statements) {

                // Database is already selected
                // through the existing db configuration

                if (
                    /^USE\s+`?student_management`?$/i
                        .test(statement)
                ) {
                    continue;
                }

                const match = statement.match(
                    /^CREATE\s+PROCEDURE\s+`?(\w+)`?\s*\(/i
                );

                if (!match) {
                    throw new Error(
                        'Only CREATE PROCEDURE statements are supported.'
                    );
                }

                const procedureName = match[1];

                // Check whether procedure already exists

                const [existing] = await pool.query(
                    `
                    SELECT ROUTINE_NAME
                    FROM information_schema.ROUTINES
                    WHERE ROUTINE_SCHEMA = DATABASE()
                    AND ROUTINE_TYPE = 'PROCEDURE'
                    AND ROUTINE_NAME = ?
                    `,
                    [procedureName]
                );

                if (existing.length > 0) {

                    console.log(
                        `SKIPPED: ${procedureName} already exists`
                    );

                    continue;

                }

                // Create the new stored procedure

                await pool.query(statement);

                console.log(
                    `CREATED: ${procedureName}`
                );

            }

        }

        console.log(
            'Database migration completed successfully.'
        );

    } catch (error) {

        console.error(
            'Migration failed:',
            error.message
        );

        process.exitCode = 1;

    } finally {

        await pool.end();

    }

}

migrate();