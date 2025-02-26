const { getGroupAdmins } = require('./groupUtils');

async function notifyAdmins(groupId, message, sock) {
    try {
        const admins = await getGroupAdmins(groupId, sock);
        for (const admin of admins) {
            await sock.sendMessage(admin, { text: `⚠️ Link phishing terdeteksi di grup ${groupId}: ${message}` });
        }
        console.log('Notifikasi telah dikirim ke admin grup.');
    } catch (error) {
        console.error('Gagal mengirim notifikasi:', error);
    }
}

module.exports = { notifyAdmins };