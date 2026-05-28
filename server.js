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

        // GET ORIGINAL API RESPONSE
        const response = await axios.get(
            `https://ft-osint-api.duckdns.org/api/email?key=ft-rahun2m&email=${email}`
        );

        let data = response.data;

        // REMOVE ALL FTGAMER2 BRANDING
        delete data.by;
        delete data.channel;
        delete data.from;
        delete data.creator;
        delete data.owner;

        // REMOVE NESTED BRANDING
        if (data.data) {

            delete data.data.by;
            delete data.data.channel;
            delete data.data.from;
            delete data.data.creator;
            delete data.data.owner;

        }

        // CONVERT TO STRING AND REMOVE ANY LEFTOVER TEXT
        let cleaned = JSON.stringify(data);

        cleaned = cleaned.replace(/@ftgamer2/gi, '');
        cleaned = cleaned.replace(/lynx_api/gi, '');
        cleaned = cleaned.replace(/https:\\\/\\\/t\\.me\\\/lynx_api/gi, '');

        data = JSON.parse(cleaned);

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
