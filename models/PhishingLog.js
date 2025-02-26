const mongoose = require('mongoose');

const phishingLogSchema = new mongoose.Schema({
    sender: { type: String, required: true }, // Nomor pengirim
    groupId: { type: String, required: true }, // ID grup
    message: { type: String, required: true }, // Pesan yang terdeteksi sebagai phishing
    timestamp: { type: Date, default: Date.now } // Waktu kejadian
});

const PhishingLog = mongoose.model('PhishingLog', phishingLogSchema);

module.exports = PhishingLog;