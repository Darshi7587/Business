const fs = require('fs');
const Papa = require('papaparse');

const csvPath = './src/data/insurance_claims.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');

const result = Papa.parse(csvContent, {
  header: true,
  skipEmptyLines: true,
  dynamicTyping: true
});

// Mapping of insurer name variations to standard names
const nameMap = {
  'ABSL': 'Aditya Birla Sun Life',
  'Aditya Birla Life': 'Aditya Birla Sun Life',
  'Baj Alz': 'Bajaj Allianz',
  'Can HSBC': 'Canara HSBC OBC',
  'Edelws': 'Edelweiss Tokio',
  'Exide': 'Exide Life',
  'Fut Genli': 'Future Generali',
  'HDFC': 'HDFC Life',
  'ICICI': 'ICICI Prudential',
  'Indiafirst': 'IndiaFirst',
  'India First': 'IndiaFirst',
  'Kotak': 'Kotak Mahindra',
  'Max': 'Max Life',
  'PNB Met Life': 'PNB MetLife',
  'PNB Metlife': 'PNB MetLife',
  'Pramerica': 'Pramerica Life',
  'Reliance': 'Reliance Nippon',
  'SUD': 'Star Union Dai-ichi',
  'Star Union': 'Star Union Dai-ichi',
  'Ageas': 'Ageas Federal',
  'Sahara': 'Sahara Life'
};

// Filter out aggregate rows and duplicates
const skipRows = ['Industry', 'Industry Total', 'PVT.', 'Private Total'];

const seen = new Set();
const cleanedData = [];

result.data.forEach(row => {
  if (!row.life_insurer) return;
  
  // Skip aggregate rows
  if (skipRows.includes(row.life_insurer)) return;
  
  // Standardize name
  const standardName = nameMap[row.life_insurer] || row.life_insurer;
  row.life_insurer = standardName;
  
  // Create unique key
  const key = standardName + '|' + row.year;
  
  // Skip duplicates
  if (seen.has(key)) return;
  seen.add(key);
  
  cleanedData.push(row);
});

// Sort by insurer then year
cleanedData.sort((a, b) => {
  if (a.life_insurer < b.life_insurer) return -1;
  if (a.life_insurer > b.life_insurer) return 1;
  return b.year.localeCompare(a.year);
});

console.log('Original rows:', result.data.length);
console.log('Cleaned rows:', cleanedData.length);
console.log('Unique insurers:', [...new Set(cleanedData.map(r => r.life_insurer))].sort());

// Write cleaned CSV
const cleanedCsv = Papa.unparse(cleanedData);
fs.writeFileSync('./src/data/insurance_claims.csv', cleanedCsv);
console.log('Saved to insurance_claims.csv');
