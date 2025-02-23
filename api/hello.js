const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb+srv://admin:yourpassword@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  try {
    await client.connect();
    const database = client.db('poker_league');

    // List of results collections (no underscore)
    const resultCollections = Array.from({ length: 11 }, (_, i) => 
      `results${String(i + 1).padStart(2, '0')}` // results01 to results11
    );

    const allResults = [];
    for (const collName of resultCollections) {
      const collection = database.collection(collName);
      try {
        const data = await collection.find({}, { projection: { _id: 0 } }).toArray();
        console.log(`Fetched ${data.length} records from ${collName}`);
        allResults.push(...data);
      } catch (err) {
        console.log(`No data or error in ${collName}: ${err.message}`);
      }
    }

    if (allResults.length === 0) {
      console.log('No results found across all collections');
      return res.json({ data: [] });
    }

    // Aggregate data by Name, ignoring "Rank" and other fields
    const standingsMap = new Map();
    allResults.forEach(entry => {
      if (!entry.Name || entry.Name.trim() === '') return;

      const name = entry.Name;
      if (!standingsMap.has(name)) {
        standingsMap.set(name, { Name: name, Points: 0, "$ Won": 0 });
      }
      const current = standingsMap.get(name);
      current.Points += Number(entry.Points) || 0;
      current["$ Won"] += Number(entry["$ Won"]) || 0;
      // Explicitly not including "Rank" or other fields
    });

    const standings = Array.from(standingsMap.values());
    console.log('Aggregated standings:', standings);

    res.json({ data: standings });
  } catch (error) {
    console.error('Error in API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
};