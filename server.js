const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const FILE_PATH = path.join(__dirname, "pages.json");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.get("/memories", (req, res) => {
  fs.readFile(FILE_PATH, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).json({ error: "Error reading file" });
    }
    res.json(JSON.parse(data));
  });
});

app.post("/memories", upload.single("picture"), (req, res) => {
  const { title, message, date } = req.body;
  const picture = req.file ? `/uploads/${req.file.filename}` : "";

  fs.readFile(FILE_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");

    const memories = JSON.parse(data);
    const newMemory = {
      id: memories.length + 1,
      title,
      picture,
      message,
      date,
    };

    memories.push(newMemory);

    fs.writeFile(FILE_PATH, JSON.stringify(memories, null, 2), (err) => {
      if (err) return res.status(500).send("Error saving file");
      res.status(201).json(newMemory);
    });
  });
});

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
