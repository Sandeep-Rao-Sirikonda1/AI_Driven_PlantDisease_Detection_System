const path = require('path'); 
const multer = require('multer');
const { exec } = require('child_process');
const Diagnosis = require('../models/Diagnosis');
const User = require('../models/User');
const { checkAndAlert } = require('../utils/checkAndAlert');
const { v2: cloudinary } = require('cloudinary');
const { MongoClient, ObjectId } = require('mongodb');
const Report = require('../models/Report');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data'); 
// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dqwhagwpc',
  api_key: '851115938765161',
  api_secret: '0N-31hUPJJfdsPt1rMYvtzWYXC0',
});

// Setup storage for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage }).single('image');

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
const uploadDiagnosis = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ message: 'Image upload failed', error: err.message });

    const filePath = req.file.path;

    try {
      // Step 1: Upload Image to Cloudinary
      const cloudinaryResult = await cloudinary.uploader.upload(filePath, { folder: 'diagnoses' });
      const imageUrl = cloudinaryResult.secure_url;

      console.log('hello');

      // Step 2: Send Image to FastAPI for Classification
      const fastApiUrl = 'http://127.0.0.1:8000/classify'; // Adjust based on your server
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      
      const apiResponse = await axios.post(fastApiUrl, formData, {
        headers: formData.getHeaders(),
      });
      
      
      const { disease_name: diseaseName, confidence_score: confidenceScore, output } = apiResponse.data;

      // Step 3: Handle Non-Leaf Response
      if (output === 'Not a leaf') return res.json({ output: 'Not a leaf' });

      // Step 4: Fetch User Details
      const userId = req.body.userId; // Replace 40 with your logic for fetching user ID
      const user = await User.findOne({ user_id: userId });
      console.log(user);
      if (!user) return res.status(404).json({ message: 'User not found.' });

      // Step 5: Save Diagnosis to MongoDB
      const diagnosis = new Diagnosis({
        disease_name: diseaseName,
        user_id: userId,
        location: user.location,
        diagnosis_date: new Date(),
        confidence_score: confidenceScore,
        image_url: imageUrl,
      });
      const savedDiagnosis = await diagnosis.save();
      await checkAndAlert(diseaseName, user.location);
      // Step 6: Query Disease Information
      await client.connect();
      const db = client.db('plant_disease');
      const collection = db.collection('diseaseinfos');
      const diseaseInfo = await collection.findOne({ [diseaseName]: { $exists: true } });
      if (!diseaseInfo) return res.status(404).json({ message: 'Disease information not found in the database.' });

      // Step 7: Return Response
      res.json({
        message: 'Diagnosis stored successfully',
        diagnosisId: savedDiagnosis._id,
        output: `Disease Name: ${diseaseName}, Confidence Score: ${confidenceScore}`,
        diagnosis,
        disease_info: diseaseInfo[diseaseName],
      });
    } catch (error) {
         console.error(error);
      res.status(500).json({ message: 'Failed to classify and process image', error: error.message });
    } finally {
      // Clean up local files and close DB connection
      fs.unlinkSync(filePath);
      await client.close();
    }
  });
};
// Report Diagnosis Logic
const reportDiagnosis = async (req, res) => {
  const { diagnosisId, comment } = req.body; // Removed conflicting 'diagnosis'
  console.log("Id", diagnosisId)
  console.log('Request body:', req.body);

  // Check if diagnosisId is provided
  if (!diagnosisId) {
    return res.status(400).json({ message: 'Diagnosis ID is required.' });
  }

  // Validate diagnosisId format
  if (!ObjectId.isValid(diagnosisId)) {
    return res.status(400).json({ message: 'Invalid diagnosis ID format.' });
  }

  try {
    // Find the corresponding diagnosis
    const foundDiagnosis = await Diagnosis.findById(diagnosisId);
    if (!foundDiagnosis) {
      return res.status(404).json({ message: 'Diagnosis not found.' });
    }

    // Create a new report
    const report = new Report({
      diagnosisId,
      comment,
    });

    await report.save();

    // Mark the diagnosis as reported
    const updatedDiagnosis = await Diagnosis.findByIdAndUpdate(
      diagnosisId,
      { reported: true },
      { new: true } // Return the updated document
    );

    res.json({
      message: 'Report submitted successfully',
      report,
      updatedDiagnosis,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit the report', error: error.message });
  }
};
module.exports = { uploadDiagnosis, reportDiagnosis };
