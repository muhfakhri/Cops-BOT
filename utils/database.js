const mongoose = require('mongoose');

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Terhubung ke database MongoDB.');
    } catch (error) {
        console.error('Gagal terhubung ke database:', error);
        process.exit(1); // Keluar dari proses jika gagal terhubung
    }
}

module.exports = connectToDatabase;