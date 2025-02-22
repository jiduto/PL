const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://jiduto:Ee4422400!!@clusterpl.irn25.mongodb.net/?retryWrites=true&w=majority&appName=ClusterPL";

module.exports = async (req, res) => { 
	const client = new MongoClient(uri); try { 
	await client.connect(); 
	const db = client.db('test'); 
	const collection = db.collection('items'); 
	await collection.insertOne({ name: "Test Item" }); 
	const result = await 
collection.findOne({ name: "Test Item" }); 
	res.json({ message: "Data from MongoDB: " + result.name }); 
	} catch (e) { 
	res.status(500).json({ error: e.message }); 
	} finally { 
		await client.close(); 
	} 
};