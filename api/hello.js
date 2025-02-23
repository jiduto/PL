const { MongoClient } = require('mongodb');

// Use environment variable for security (set in Vercel dashboard)
const uri = process.env.MONGODB_URI || "mongodb+srv://jiduto:Ee4422400!!@clusterpl.irn25.mongodb.net/?retryWrites=true&w=majority&appName=ClusterPL";
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  try {
    await client.connect();
    const database = client.db('poker_league');
    const collection = database.collection('standings');

    // Fetch all documents from the standings collection
    const data = await collection.find({}).toArray();

    // Format data to match previous CSV structure (no $ formatting here)
    res.json({ data });
  } catch (error) {
    console.error('Error fetching from MongoDB:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
};