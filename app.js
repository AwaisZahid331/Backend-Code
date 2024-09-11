const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();



const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Successfully connected to the database"))
  .catch((e) => console.error("Database connection error:", e));

// Middleware
app.use(cors());
app.use(express.json());

// Import the PDF schema
const pdfSchema = require("./models/pdfDetails");

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Serve static files
const filesDir = path.join(__dirname, "files");
app.use("/files", express.static(filesDir));

// Create the files directory if it doesn't exist
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'), false);
    }
    cb(null, true);
  },
});

// Endpoint to upload a file
app.post("/upload-files", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const title = req.body.title;
  const filename = req.file.filename;

  try {
    const newPdf = await pdfSchema.create({ title, pdf: filename });
    res.status(200).json({ status: "ok", file: newPdf });
  } catch (error) {
    console.error("Error during file upload:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Endpoint to get all files
app.get("/get-files", async (req, res) => {
  try {
    const data = await pdfSchema.find({});
    res.status(200).json({ status: "ok", data });
  } catch (error) {
    console.error("Error fetching files:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to delete a file
app.delete("/delete-file/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fileToDelete = await pdfSchema.findById(id);
    if (!fileToDelete) {
      return res.status(404).send("File not found.");
    }

    const filePath = path.join(filesDir, fileToDelete.pdf);
    console.log("Attempting to delete file at path:", filePath);

    // Check if the file exists before trying to delete it
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log("File deleted from filesystem.");
      } catch (error) {
        console.error("Error deleting file from filesystem:", error.message);
        return res.status(500).send("Error deleting file from filesystem");
      }
    } else {
      console.log("File not found on filesystem.");
    }

    // Remove the file record from the database
    await pdfSchema.findByIdAndDelete(id);
    res.status(200).send("File deleted successfully.");
  } catch (error) {
    console.error("Error deleting file:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// API endpoint for testing
app.get("/", (req, res) => {
  res.send("Server is up and running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
