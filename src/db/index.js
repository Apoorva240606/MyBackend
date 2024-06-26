import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongeDB connectrd !! DB HOST :
            ${connectionInstance.connection.host}`);
            // app.on("error", (err) => {console.log(err); throw err});
    }
    catch (error) {
        console.log("MongoDB error: ",error );
        process.exit(1);
    }
}


export default connectDB;