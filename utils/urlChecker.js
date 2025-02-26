const axios = require('axios');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI; // MongoDB connection string
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function getPhishingKeywords() {
    try {
        await client.connect();
        const database = client.db('phishingDB');
        const collection = database.collection('phishing_keywords');
        const keywords = await collection.find({}).toArray();
        return keywords.map(keyword => keyword.keyword);
    } finally {
        await client.close();
    }
}

async function getBlacklistDomains() {
    try {
        await client.connect();
        const database = client.db('phishingDB');
        const collection = database.collection('blacklist_domains');
        const domains = await collection.find({}).toArray();
        return domains.map(domain => domain.domain);
    } finally {
        await client.close();
    }
}

// Fungsi untuk memeriksa URL menggunakan Google Safe Browsing API
async function checkUrlWithSafeBrowsing(url) {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    if (!apiKey) {
        console.error('Google Safe Browsing API Key tidak ditemukan.');
        return false;
    }

    const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

    const payload = {
        client: {
            clientId: 'whatsapp-bot',
            clientVersion: '1.0',
        },
        threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING'], // Jenis ancaman yang diperiksa
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }], // URL yang akan diperiksa
        },
    };

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Jika ada match, URL dianggap phishing
        return response.data.matches ? true : false;
    } catch (error) {
        console.error('Error checking URL with Safe Browsing:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        return false;
    }
}

// Fungsi untuk mendeteksi kata kunci phishing dalam URL
async function isSuspiciousUrl(url) {
    try {
        const domain = new URL(url).hostname;
        const phishingKeywords = await getPhishingKeywords();
        return phishingKeywords.some(keyword => domain.includes(keyword));
    } catch (error) {
        console.error('URL tidak valid:', url);
        return false;
    }
}

// Fungsi untuk mendeteksi domain blacklist dalam URL
async function isBlacklistedDomain(url) {
    try {
        const domain = new URL(url).hostname;
        const blacklistDomains = await getBlacklistDomains();
        return blacklistDomains.includes(domain);
    } catch (error) {
        console.error('URL tidak valid:', url);
        return false;
    }
}

// Fungsi utama untuk memeriksa URL
async function isPhishingUrl(url) {
    // Periksa apakah URL valid
    if (!url || typeof url !== 'string') {
        console.error('URL tidak ditemukan atau tidak valid.');
        return false;
    }

    // Periksa menggunakan Google Safe Browsing
    const isSafeBrowsingPhishing = await checkUrlWithSafeBrowsing(url);
    if (isSafeBrowsingPhishing) return true;

    // Periksa menggunakan kata kunci
    const isKeywordPhishing = await isSuspiciousUrl(url);
    if (isKeywordPhishing) return true;

    // Periksa menggunakan domain blacklist
    const isDomainBlacklisted = await isBlacklistedDomain(url);
    if (isDomainBlacklisted) return true;

    // Jika semua pemeriksaan gagal, anggap URL aman
    return false;
}

module.exports = { isPhishingUrl };