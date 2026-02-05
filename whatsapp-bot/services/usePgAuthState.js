const pool = require('../config/database');
// 2. Helper to read data (handling BufferJSON parsing)
// ...
const usePgAuthState = async (baileys) => {
    const { initAuthCreds, BufferJSON, proto } = baileys;

    // 1. Ensure table exists
    // 1. Ensure table exists
    await pool.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_auth (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT
        )
    `);

    // 2. Helper to read data (handling BufferJSON parsing)
    const readData = async (key) => {
        try {
            const res = await pool.query('SELECT value FROM whatsapp_auth WHERE key = $1', [key]);
            if (res.rows.length === 0) return null;
            return JSON.parse(res.rows[0].value, BufferJSON.reviver);
        } catch (error) {
            console.error(`Error reading auth key ${key}:`, error);
            return null;
        }
    };

    // 3. Helper to write data
    const writeData = async (key, value) => {
        try {
            const jsonValue = JSON.stringify(value, BufferJSON.replacer);
            await pool.query(`
                INSERT INTO whatsapp_auth (key, value) VALUES ($1, $2)
                ON CONFLICT (key) DO UPDATE SET value = $2
            `, [key, jsonValue]);
        } catch (error) {
            console.error(`Error writing auth key ${key}:`, error);
        }
    };

    // 4. Helper to remove data
    const removeData = async (key) => {
        try {
            await pool.query('DELETE FROM whatsapp_auth WHERE key = $1', [key]);
        } catch (error) {
            console.error(`Error deleting auth key ${key}:`, error);
        }
    };

    // 5. Load credentials or initialize new ones
    const creds = (await readData('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        const key = `${type}:${id}`;
                        let value = await readData(key);
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        if (value) {
                            data[id] = value;
                        }
                    }));
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const type in data) {
                        for (const id in data[type]) {
                            const key = `${type}:${id}`;
                            const value = data[type][id];
                            if (value) {
                                tasks.push(writeData(key, value));
                            } else {
                                tasks.push(removeData(key));
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: async () => {
            await writeData('creds', creds);
        }
    };
};

module.exports = usePgAuthState;
