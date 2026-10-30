process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
});

import "dotenv/config";
import server from "./app";
import connectDB from "./config/db";
import { seedDemoIncidents } from "./utils/seed";

const PORT = process.env.PORT || 8000;

// Start the server after connecting to the database
connectDB()
    .then(async () => {
        await seedDemoIncidents();
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Error starting server:", error);
    });

process.on("unhandledRejection", (err: any) => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    console.error(err.stack);
    server.close(() => {
        process.exit(1);
    });
});
