const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb+srv://admin:yourpassword@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  try {
    await client.connect();
    const database = client.db('poker_league');

    // List of all results collections
    const resultCollections = Array.from({ length: 11 }, (_, i) => 
      `results_${String(i + 1).padStart(2, '0')}` // results_01 to results_11
    );

    // Fetch data from all collections
    const allResults = [];
    for (const collName of resultCollections) {
      const collection = database.collection(collName);
      const data = await collection.find({}, { projection: { _id: 0 } }).toArray();
      allResults.push(...data);
    }

    // Aggregate data by Name
    const standingsMap = new Map();
    allResults.forEach(entry => {
      const name = entry.Name;
      if (!standingsMap.has(name)) {
        standingsMap.set(name, { Name: name, Points: 0, "$ Won": 0 });
      }
      const current = standingsMap.get(name);
      current.Points += entry.Points || 0;
      current["$ Won"] += entry["$ Won"] || 0;
    });

    // Convert map to array for response
    const standings = Array.from(standingsMap.values());

    res.json({ data: standings });
  } catch (error) {
    console.error('Error fetching from MongoDB:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
};