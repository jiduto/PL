const fs = require('fs').promises; // For reading files
const path = require('path');
const { parse } = require('csv-parse/sync');

module.exports = async (req, res) => {
  try {
    // Path to the CSV file
    const csvPath = path.join(__dirname, '../data.csv');
    const csvData = await fs.readFile(csvPath, 'utf-8');

    // Parse CSV into an array of objects
    const records = parse(csvData, {
      columns: true, // Use first row as headers
      skip_empty_lines: true
    });

    // Send the data as JSON
    res.json({ data: records });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};