const mongoose = require('mongoose'); //purpose of making this file is to open the MongoDB connection by importing mongoose
//Mongoose opens the db connection
const connectDB = async () => { // this is a reusable async bootstrap function
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...'); // log the success
    } catch (err) { // in the case of an error, log and exit process
        console.error(err.message);
        process.exit(1);
    }
};

module.exports = connectDB; //
