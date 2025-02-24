const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb+srv://jiduto:Ee4422400!!@clusterpl.irn25.mongodb.net/?retryWrites=true&w=majority&appName=ClusterPL";
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully');
    const database = client.db('poker_league');
    console.log('Using database: poker_league');

    // Dynamically fetch all collections starting with "results"
    const collections = await database.listCollections().toArray();
    const resultCollections = collections
      .filter(c => c.name.startsWith('results'))
      .map(c => c.name)
      .sort(); // Ensures results01, results02, etc., in order
    console.log('Detected collections:', resultCollections);

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
      if (!entry.NAME || entry.NAME.trim() === '') {
        console.log('Skipping invalid entry (no NAME):', entry);
        return;
      }

      const name = entry.NAME;
      if (!standingsMap.has(name)) {
        standingsMap.set(name, { 
          Name: name, 
          Points: 0, 
          "$ Won": 0, 
          "KO's": 0, 
          "# of Games Played": 0 
        });
      }
      const current = standingsMap.get(name);
      current.Points += Number(entry.POINTS) || 0;
      current["$ Won"] += Number(String(entry["$ Won"]).replace('$', '').replace(/,/g, '')) || 0;
      current["KO's"] += Number(entry["KO's"]) || 0;
      current["# of Games Played"] += Number(entry["# of Games Played"]) || 0;
      console.log('Processed entry for', name, 'Current totals:', current);
    });

    let standings = Array.from(standingsMap.values());

    if (standings.length === 0) {
      console.log('No valid standings after aggregation');
      return res.json({ data: [] });
    }

    standings.sort((a, b) => b.Points - a.Points);
    standings.forEach((entry, index) => {
      entry.Rank = index + 1;
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