const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    app.post("/users", async (req, res) => {
      const { name, email, photoURL } = req.body;

      const existingUser = await usersCollection.findOne({ email: email });

      if (existingUser) {
        return res.json({ message: "User already exists" });
      }

      const result = await usersCollection.insertOne({ name, email, photoURL });
      res.json(result);
    });

    app.get("/crops", async (req, res) => {
      const crops = await cropsCollection.find().toArray();
      res.json(crops);
    });

    app.get("/crops/latest", async (req, res) => {
      const crops = await cropsCollection
        .find()
        .sort({ _id: -1 })
        .limit(6)
        .toArray();
      res.json(crops);
    });

    app.get("/crops/:id", async (req, res) => {
      const id = req.params.id;
      const crop = await cropsCollection.findOne({ _id: new ObjectId(id) });
      res.json(crop);
    });

    app.post("/crops", async (req, res) => {
      const {
        name,
        type,
        pricePerUnit,
        unit,
        quantity,
        description,
        location,
        image,
        owner,
      } = req.body;

      const cropData = {
        name,
        type,
        pricePerUnit,
        unit,
        quantity,
        description,
        location,
        image,
        owner,
        interests: [],
      };

      const result = await cropsCollection.insertOne(cropData);
      res.json(result);
    });

    app.get("/my-crops/:email", async (req, res) => {
      const email = req.params.email;
      const crops = await cropsCollection
        .find({ "owner.ownerEmail": email })
        .toArray();
      res.json(crops);
    });

    app.put("/crops/:id", async (req, res) => {
      const id = req.params.id;
      const {
        name,
        type,
        pricePerUnit,
        unit,
        quantity,
        description,
        location,
        image,
      } = req.body;

      const result = await cropsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name,
            type,
            pricePerUnit,
            unit,
            quantity,
            description,
            location,
            image,
          },
        }
      );
      res.json(result);
    });

    app.delete("/crops/:id", async (req, res) => {
      const id = req.params.id;
      const result = await cropsCollection.deleteOne({ _id: new ObjectId(id) });
      res.json(result);
    });

    app.post("/interests", async (req, res) => {
      const { cropId, userEmail, userName, quantity, message, status } =
        req.body;

      const newInterest = {
        _id: new ObjectId(),
        cropId,
        userEmail,
        userName,
        quantity,
        message,
        status,
      };

      const result = await cropsCollection.updateOne(
        { _id: new ObjectId(cropId) },
        { $push: { interests: newInterest } }
      );
      res.json(result);
    });

    app.get("/my-interests/:email", async (req, res) => {
      const email = req.params.email;

      const crops = await cropsCollection
        .find({ "interests.userEmail": email })
        .toArray();

      const userInterests = [];

      crops.forEach((crop) => {
        crop.interests.forEach((interest) => {
          if (interest.userEmail === email) {
            userInterests.push({
              ...interest,
              cropName: crop.name,
              ownerName: crop.owner.ownerName,
              ownerEmail: crop.owner.ownerEmail,
            });
          }
        });
      });

      res.json(userInterests);
    });

    app.put("/interests/update", async (req, res) => {
      const { interestId, cropId, status } = req.body;

      const result = await cropsCollection.updateOne(
        {
          _id: new ObjectId(cropId),
          "interests._id": new ObjectId(interestId),
        },
        { $set: { "interests.$.status": status } }
      );

      if (status === "accepted") {
        const crop = await cropsCollection.findOne({
          _id: new ObjectId(cropId),
        });

        const acceptedInterest = crop.interests.find(
          (interest) => interest._id.toString() === interestId
        );

        await cropsCollection.updateOne(
          { _id: new ObjectId(cropId) },
          { $inc: { quantity: -acceptedInterest.quantity } }
        );
      }

      res.json(result);
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
