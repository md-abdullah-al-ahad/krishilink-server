const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uwxcdte.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;
let cropsCollection;
let usersCollection;

async function connectDB() {
  try {
    if (!db) {
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      console.log("Successfully connected to MongoDB!");
      db = client.db(process.env.DB_NAME);
      cropsCollection = db.collection("crops");
      usersCollection = db.collection("users");
      console.log("Collections initialized:", {
        crops: !!cropsCollection,
        users: !!usersCollection,
      });
    }
    return true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

connectDB();

app.get("/", (req, res) => {
  res.send("KrishiLink Server Running");
});

app.get("/health", async (req, res) => {
  try {
    await connectDB();
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
  try {
    await connectDB();
    if (!usersCollection) {
      throw new Error("Database not initialized");
    }
    const { name, email, photoURL, createdAt } = req.body;
    const existingUser = await usersCollection.findOne({ email: email });
    if (existingUser) {
      return res.json({
        message: "User already exists",
        insertedId: existingUser._id,
      });
    }
    const result = await usersCollection.insertOne({
      name,
      email,
      photoURL,
      createdAt: createdAt || new Date().toISOString(),
    });
    res.json(result);
  } catch (error) {
    console.error("Error in /users:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/crops", async (req, res) => {
  try {
    await connectDB();
    const crops = await cropsCollection.find().toArray();
    res.json(crops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/crops/latest", async (req, res) => {
  try {
    await connectDB();
    const crops = await cropsCollection
      .find()
      .sort({ _id: -1 })
      .limit(6)
      .toArray();
    res.json(crops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/crops/:id", async (req, res) => {
  try {
    await connectDB();
    const id = req.params.id;
    const crop = await cropsCollection.findOne({ _id: new ObjectId(id) });
    res.json(crop);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/crops", async (req, res) => {
  try {
    await connectDB();
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/my-crops/:email", async (req, res) => {
  try {
    await connectDB();
    const email = req.params.email;
    const crops = await cropsCollection
      .find({ "owner.ownerEmail": email })
      .toArray();
    res.json(crops);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/crops/:id", async (req, res) => {
  try {
    await connectDB();
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/crops/:id", async (req, res) => {
  try {
    await connectDB();
    const id = req.params.id;
    const result = await cropsCollection.deleteOne({ _id: new ObjectId(id) });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/interests", async (req, res) => {
  try {
    await connectDB();
    const { cropId, userEmail, userName, quantity, message, status } = req.body;
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/my-interests/:email", async (req, res) => {
  try {
    await connectDB();
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/interests/update", async (req, res) => {
  try {
    await connectDB();
    const { interestId, cropId, status } = req.body;
    const result = await cropsCollection.updateOne(
      { _id: new ObjectId(cropId), "interests._id": new ObjectId(interestId) },
      { $set: { "interests.$.status": status } }
    );
    if (status === "accepted") {
      const crop = await cropsCollection.findOne({ _id: new ObjectId(cropId) });
      const acceptedInterest = crop.interests.find(
        (interest) => interest._id.toString() === interestId
      );
      if (acceptedInterest) {
        await cropsCollection.updateOne(
          { _id: new ObjectId(cropId) },
          { $inc: { quantity: -acceptedInterest.quantity } }
        );
      }
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`KrishiLink Server is running on port ${port}`);
  });
}

module.exports = app;
