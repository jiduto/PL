const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb+srv://jiduto:Ee4422400!!@clusterpl.irn25.mongodb.net/?retryWrites=true&w=majority&appName=ClusterPL";
const client = new MongoClient(uri);

module.exports = async (req, res) => {
  const { game } = req.query; // e.g., "01", "02", etc.
  if (!game || !/^\d{2}$/.test(game) || game < "01" || game > "11") {
    return res.status(400).json({ error: 'Invalid game number' });
  }

  try {
    await client.connect();
    const database = client.db('poker_league');
    const collectionName = `results${game}`;
    const collection = database.collection(collectionName);

    const data = await collection.find({}, { projection: { _id: 0 } }).toArray();
    console.log(`Fetched ${data.length} records from ${collectionName}:`, data);

    if (data.length === 0) {
      return res.json({ data: [] });
    }

    res.json({ data });
  } catch (error) {
    console.error(`Error fetching game ${game} results:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.close();
  }
};