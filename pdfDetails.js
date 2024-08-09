const mongoose = require('mongoose');

const pdfDetailSchema = new mongoose.Schema({
  pdf: String,
  title: String,
}, {
  collection: "pdfDetails"
});

mongoose.model("pdfDetails", pdfDetailSchema);
