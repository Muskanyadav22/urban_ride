const db = require('../db');

async function addTripColumns() {
  try {
    console.log('Adding trip start/end columns to rides table...\n');
    
    const queries = [
      `ALTER TABLE rides ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;`,
      `ALTER TABLE rides ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;`,
      `ALTER TABLE rides ADD COLUMN IF NOT EXISTS started_location_lat DECIMAL(10, 8);`,
      `ALTER TABLE rides ADD COLUMN IF NOT EXISTS started_location_lng DECIMAL(11, 8);`,
      `ALTER TABLE rides ADD COLUMN IF NOT EXISTS ended_location_lat DECIMAL(10, 8);`,
      `ALTER TABLE rides ADD COLUMN IF NOT EXISTS ended_location_lng DECIMAL(11, 8);`,
      `ALTER TABLE rides ADD COLUMN IF NOT EXISTS trip_duration_minutes INT;`,
    ];
    
    for (const query of queries) {
      try {
        await db.query(query);
        console.log(`✅ ${query.split('ADD COLUMN')[1].split(' ')[1]}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`⏭️  Column already exists`);
        } else {
          throw err;
        }
      }
    }
    
    console.log('\n✅ All columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }
}

addTripColumns();
