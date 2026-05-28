const express = require('express');
const axios = require('axios');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const DB_FILE = './keys.json';

// CREATE DATABASE
if (!fs.existsSync(DB_FILE)) {
    fs.writeJsonSync(DB_FILE, []);
}

// LOAD KEYS
function loadKeys() {
    return fs.readJsonSync(DB_FILE);
}

// SAVE KEYS
function saveKeys(keys) {
    fs.writeJsonSync(DB_FILE, keys, { spaces: 2 });
}

// REMOVE EXPIRED KEYS
function cleanExpiredKeys() {

    const keys = loadKeys();

    const now = Date.now();

    const validKeys = keys.filter(k => k.expiry > now);

    saveKeys(validKeys);
}

setInterval(cleanExpiredKeys, 60000);

// VALIDATE KEY
function validateKey(apiKey) {

    cleanExpiredKeys();

    const keys = loadKeys();

    const found = keys.find(k => k.key === apiKey);

    if (!found) {
        return false;
    }

    return true;
}

// HOME PAGE
app.get('/', (req, res) => {

    res.json({
        status: true,
        message: 'VERNEX EMAIL API RUNNING',
        api_by: 'VERNEX'
    });

});

// GENERATE API KEY
app.get('/generate-key', (req, res) => {

    const duration = req.query.duration || '30d';

    let ms = 30 * 86400000;

    if (duration.endsWith('d')) {
        ms = parseInt(duration) * 86400000;
    }

    if (duration.endsWith('h')) {
        ms = parseInt(duration) * 3600000;
    }

    if (duration.endsWith('m')) {
        ms = parseInt(duration) * 60000;
    }

    const apiKey = 'vernex-' + uuidv4().replace(/-/g, '').slice(0, 25);

    const expiry = Date.now() + ms;

    const keys = loadKeys();

    keys.push({
        key: apiKey,
        expiry: expiry
    });

    saveKeys(keys);

    res.json({
        status: true,
        api_key: apiKey,
        expires_at: new Date(expiry).toISOString(),
        api_by: 'VERNEX'
    });

});

// EMAIL CLONE API
app.get('/api/email', async (req, res) => {

    try {

        const apiKey = req.query.key;
        const email = req.query.email;

        if (!apiKey) {
            return res.json({
                status: false,
                message: 'API key required'
            });
        }

        if (!email) {
            return res.json({
                status: false,
                message: 'Email required'
            });
        }

        const valid = validateKey(apiKey);

        if (!valid) {
            return res.json({
                status: false,
                message: 'Invalid or Expired API Key'
            });
        }

        // TAKE RESPONSE FROM ORIGINAL API
        const response = await axios.get(
            `https://ft-osint-api.duckdns.org/api/email?key=ft-rahun2m&email=${email}`
        );

        const data = response.data;

        // REMOVE ORIGINAL BRANDING
        delete data.by;
        delete data.channel;
        delete data.from;

        // ADD YOUR BRANDING
        data.api_by = 'VERNEX';

        return res.json(data);

    } catch (error) {

        return res.json({
            status: false,
            message: 'Failed to fetch email data',
            error: error.message,
            api_by: 'VERNEX'
        });

    }

});

// LIST ALL KEYS
app.get('/keys', (req, res) => {

    cleanExpiredKeys();

    const keys = loadKeys();

    res.json({
        total_keys: keys.length,
        keys,
        api_by: 'VERNEX'
    });

});

// DELETE KEY
app.get('/delete-key', (req, res) => {

    const key = req.query.key;

    if (!key) {
        return res.json({
            status: false,
            message: 'Key required'
        });
    }

    const keys = loadKeys();

    const filtered = keys.filter(k => k.key !== key);

    saveKeys(filtered);

    res.json({
        status: true,
        message: 'Key deleted successfully',
        api_by: 'VERNEX'
    });

});

app.listen(PORT, () => {
    console.log(`VERNEX EMAIL API running on port ${PORT}`);
});
