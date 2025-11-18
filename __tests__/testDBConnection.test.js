import db from '../src/config/db.js';

describe('Database Connection', () => {

    test('should connect to the database and execute a simple query', async () => {
        const result = await db.query('SELECT NOW()');
        expect(result).toBeDefined();
        expect(result.rows.length).toBeGreaterThan(0);
        console.log('Database Time:', result.rows[0]);
    });

    afterAll(async () => {
        await db.end();     // Fixes Jest open handle leak
    });

});
