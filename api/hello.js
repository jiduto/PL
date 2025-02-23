const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb+srv://admin:yourpassword@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully');
    const database = client.db('poker_league');
    console.log('Using database: poker_league');

    const resultCollections = Array.from({ length: 11 }, (_, i) => 
      `results${String(i + 1).padStart(2, '0')}` // results01 to results11
    );
    console.log('Collections to check:', resultCollections);

    const allResults = [];
    for (const collName of resultCollections) {
      const collection = database.collection(collName);
      try {
        const data = await collection.find({}, { projection: { _id: 0 } }).toArray();
        console.log(`Fetched ${data.length} records from ${collName}:`, data);
        allResults.push(...data);
      } catch (err) {
        console.log(`No data or error in ${collName}: ${err.message}`);
      }
    }

    if (allResults.length === 0) {
      console.log('No results found across all collections');
      return res.json({ data: [] });
    }

    const standingsMap = new Map();
    allResults.forEach((entry, index) => {
      // Use "NAME" (uppercase) as in your data
      if (!entry.NAME || entry.NAME.trim() === '') {
        console.log('Skipping invalid entry (no NAME):', entry);
        return;
      }

      const name = entry.NAME;
      if (!standingsMap.has(name)) {
        standingsMap.set(name, { Name: name, Points: 0, "$ Won": 0 });
      }
      const current = standingsMap.get(name);
      current.Points += Number(entry.POINTS) || 0; // Use "POINTS" (uppercase)
      // Handle "$ Won" as string or number
      current["$ Won"] += Number(String(entry["$ Won"]).replace('$', '').replace(/,/g, '')) || 0;
      console.log('Processed entry for', name, 'Current totals:', current);
    });

    let standings = Array.from(standingsMap.values());

    if (standings.length === 0) {
      console.log('No valid standings after aggregation');
      return res.json({ data: [] });
    }

    standings.sort((a, b) => b.Points - a.Points);
    standings.forEach((entry, index) => {
      entry.Rank = index + 1; // Dynamic Rank based on Points
    });

    console.log('Aggregated standings with ranks:', standings);

    res.json({ data: standings });
  } catch (error) {
    console.error('Error in API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
};