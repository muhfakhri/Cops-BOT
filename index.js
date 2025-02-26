require('dotenv').config();
const { useMultiFileAuthState, makeWASocket } = require('@whiskeysockets/baileys');
const mongoose = require('mongoose');
const PhishingLog = require('./models/PhishingLog');
const { notifyAdmins } = require('./utils/notifications');
const { kickUser } = require('./utils/groupUtils');
const { isPhishingUrl } = require('./utils/urlChecker');

// Koneksi ke database
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Terhubung ke database MongoDB.'))
.catch(err => console.error('Gagal terhubung ke database:', err));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({ auth: state, printQRInTerminal: true });

    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'close') startBot(); // Reconnect jika terputus
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const message = messages[0];
        if (!message.key.fromMe && message.message) {
            const text = message.message.conversation || message.message.extendedTextMessage?.text;
            const sender = message.key.participant || message.key.remoteJid;
            const groupId = message.key.remoteJid;
            const messageKey = message.key; // Ambil messageKey untuk menghapus pesan

            if (text) {
                // Update regex to match domains
                const domainRegex = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/gi;
                const domains = text.match(domainRegex);

                if (domains) {
                    for (let domain of domains) {
                        // Prepend http:// if the domain does not have a protocol
                        let url = domain;
                        if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            url = 'http://' + url;
                        }

                        const isPhishing = await isPhishingUrl(url);
                        if (isPhishing) {
                            console.log(`Pesan phishing terdeteksi dari ${sender}: ${text}`);
                            await PhishingLog.create({ sender, groupId, message: text });
                            await kickUser(groupId, sender, messageKey, sock); // Panggil fungsi kickUser dengan messageKey
                            await notifyAdmins(groupId, text, sock); // Kirim notifikasi ke admin
                            break; // Keluar dari loop setelah menemukan URL phishing
                        }
                    }
                }
            }
        }
    });
}

startBot().catch(err => console.error('Error starting bot:', err));