async function getGroupAdmins(groupId, sock) {
    try {
        const groupInfo = await sock.groupMetadata(groupId);
        return groupInfo.participants.filter(p => p.admin).map(p => p.id);
    } catch (error) {
        console.error('Gagal mendapatkan daftar admin:', error);
        return [];
    }
}

async function deleteMessage(groupId, messageKey, sock) {
    try {
        await sock.sendMessage(groupId, { delete: messageKey });
        console.log(`Pesan berhasil dihapus.`);
    } catch (error) {
        console.error('Gagal menghapus pesan:', error);
    }
}

async function kickUser(groupId, userJid, messageKey, sock) {
    try {
        // Keluarkan pengguna dari grup
        await sock.groupParticipantsUpdate(groupId, [userJid], 'remove');
        console.log(`User ${userJid} telah dikeluarkan dari grup ${groupId}`);

        // Hapus pesan yang mengandung link phishing
        await deleteMessage(groupId, messageKey, sock);

        // Kirim pesan ke grup bahwa pengguna telah dikeluarkan
        await sock.sendMessage(groupId, { 
            text: `🚫 Pengguna @${userJid.split('@')[0]} telah dikeluarkan karena terdeteksi mengirim link phishing. (All Cops Are Beautifull)`
        });
    } catch (error) {
        console.error('Gagal mengeluarkan pengguna atau menghapus pesan:', error);
    }
}

module.exports = { getGroupAdmins, kickUser, deleteMessage };