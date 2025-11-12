const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");

    const database = client.db(process.env.DB_NAME);

    const cropsCollection = database.collection("crops");
    const usersCollection = database.collection("users");

    app.get("/", (req, res) => {
      res.send("KrishiLink Server Running");
    });

    app.get("/health", async (req, res) => {
      try {
        const result = await client.db("admin").command({ ping: 1 });
        res.json({
          status: "OK",
          message: "Server and Database are running",
          database: process.env.DB_NAME,
        });
      } catch (error) {
        res.status(500).json({
          status: "ERROR",
          message: "Database connection failed",
          error: error.message,
        });
      }
    });

    app.listen(port, () => {
      console.log(`KrishiLink Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

run().catch(console.dir);

process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await client.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});
