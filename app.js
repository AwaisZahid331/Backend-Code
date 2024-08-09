const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(cors());
app.use("/files", express.static(path.join(__dirname, "files")));

// Create the files directory if it doesn't exist
const filesDir = path.join(__dirname, "files");
if (!fs.existsSync(filesDir)) {
  fs.mkdirSync(filesDir, { recursive: true });
}

// For MongoDB connection
const mongoUrl = "mongodb+srv://zahidawais31:Y70QD7Z7NV8wUl0E@cluster0.aetta7x.mongodb.net/stu_data?retryWrites=true&w=majority";
mongoose.connect(mongoUrl)
  .then(() => {
    console.log("Successfully connected to database");
  })
  .catch((e) => {
    console.error("Database connection error:", e);
  });

// For multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, filesDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

// Import the PDF schema
require("./pdfDetails");
const pdfSchema = mongoose.model("pdfDetails");

// Endpoint to upload a file
app.post("/upload-files", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  console.log("Uploaded file:", req.file);
  const title = req.body.title;
  const filename = req.file.filename;

  try {
    const newPdf = await pdfSchema.create({ title: title, pdf: filename });
    res.status(200).json({ status: "ok", file: newPdf });
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Endpoint to get all files
app.get("/get-files", async (req, res) => {
  try {
    const data = await pdfSchema.find({});
    res.status(200).json({ status: "ok", data: data });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint to delete a file
app.delete("/delete-file/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // Find and delete the file from the database
    const fileToDelete = await pdfSchema.findById(id);
    if (!fileToDelete) {
      return res.status(404).send("File not found.");
    }

    // Delete the file from the filesystem
    const filePath = path.join(filesDir, fileToDelete.pdf);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove the file entry from the database
    await pdfSchema.findByIdAndDelete(id);

    res.status(200).send("File deleted successfully.");
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).send("Internal Server Error");
  }
});

// API endpoint
app.get("/", (req, res) => {
  res.send("Server is up and running");
});

app.listen(5000, () => {
  console.log("Server Started on port 5000");
});
