const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "memories_db";
const COLLECTION_NAME = "memories";

const client = new MongoClient(MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}
connectDB();

// Multer Storage for Image Uploads

const storage = multer.memoryStorage();
const upload = multer({ storage });

// app.use(cors());
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" })); // Increase limit for Base64 images

// Fetch Memories (Ensure Base64 Format)
app.get("/memories", async (req, res) => {
  try {
    const db = client.db(DB_NAME);
    const memories = await db.collection(COLLECTION_NAME).find({}).toArray();

    const formattedMemories = memories.map((memory) => ({
      ...memory,
      picture: memory.picture.startsWith("data:image")
        ? memory.picture
        : `data:image/jpeg;base64,${memory.picture}`,
    }));

    formattedMemories.push({
      id: "",
      title: "More memories in the making...",
      message: "",
    });

    res.json(formattedMemories);
  } catch (error) {
    console.error("Error fetching memories:", error);
    res.status(500).json({ error: "Error fetching memories" });
  }
});

// Upload Memory (Convert to Base64)
app.post("/memories", upload.single("picture"), async (req, res) => {
  try {
    const { title, message, date } = req.body;
    let pictureData = "";

    if (req.file) {
      const ext = path.extname(req.file.originalname).substring(1) || "jpeg"; // Ensure correct format
      pictureData = `data:image/${ext};base64,${req.file.buffer.toString(
        "base64"
      )}`;
    }

    const newMemory = { title, message, date, picture: pictureData };
    const db = client.db(DB_NAME);
    const result = await db.collection(COLLECTION_NAME).insertOne(newMemory);

    res.status(201).json({ _id: result.insertedId, ...newMemory });
  } catch (error) {
    console.error("Error saving memory:", error);
    res.status(500).json({ error: "Error saving memory" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
