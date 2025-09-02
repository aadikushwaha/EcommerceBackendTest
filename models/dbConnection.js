const mongoose = require('mongoose');

const DB_Connect = async (DB_name, DB_url) => {
    try {
        await mongoose.connect(`${DB_url}${DB_name}`);
        console.log("✅ Database Connection Successfully Done!");
    } catch (error) {
        console.error("❌ Database Connection Error:", error);
    }
};

module.exports = DB_Connect;
