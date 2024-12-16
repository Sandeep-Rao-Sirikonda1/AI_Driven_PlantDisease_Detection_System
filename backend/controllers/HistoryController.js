
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
let client;

async function getClient() {
    if (!client) {
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
    }
    return client;
}

async function fetchUserHistory(userId) {
    try {
        const client = await getClient();
        const db = client.db("plant_disease_detection");

        // Fetch user history from UserHistory collection
        const userHistoryCollection = db.collection("UserHistory");
        const diseaseInfoCollection = db.collection("diseaseinfos");

        console.log(`Fetching history for user ID: ${userId}`);
        const userData = await userHistoryCollection.findOne({ "_id.user_id": userId });

        if (!userData) throw new Error(`No history found for user ID ${userId}`);

        // Enrich diagnoses with detailed disease information
        const enrichedDiagnoses = await Promise.all(
            userData.diagnoses.map(async (diagnosis) => {
                const diseaseDetails = await diseaseInfoCollection.findOne({ [diagnosis.disease_name]: { $exists: true } });
                
                // Include `details` field only if disease information is found
                return {
                    diagnosis_date: new Date(diagnosis.diagnosis_date).toLocaleDateString(),
                    disease_name: diagnosis.disease_name,
                    confidence_score: diagnosis.confidence_score,
                    image_url: diagnosis.image_url,
                    location_detected: diagnosis.location_detected,
                    reported: diagnosis.reported || false, // Include the reported status
                    ...(diseaseDetails && { details: diseaseDetails[diagnosis.disease_name] }),
                };
            })
        );

        return {
            username: userData._id.username,
            location: userData._id.location,
            diagnoses: enrichedDiagnoses,
        };
    } catch (error) {
        console.error("Error in fetchUserHistory:", error);
        throw error;
    }
}

module.exports = { fetchUserHistory };
