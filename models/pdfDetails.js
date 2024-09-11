const mongoose = require('mongoose');

// Define the schema for PDF details
const pdfDetailSchema = new mongoose.Schema({
  pdf: String,
  title: String,
}, {
  collection: "pdfDetails"  // Explicitly specifying the collection name
});

// Register the schema as a model and assign it to a variable
const PdfDetail = mongoose.model("PdfDetail", pdfDetailSchema);

// Export the model to use it in other parts of your application
module.exports = PdfDetail;
