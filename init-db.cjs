const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./database.sqlite')

console.log('Creating database tables...')

// Create donations table
db.run(`
  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    donor_name TEXT NOT NULL,
    phone_number TEXT,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    is_anonymous INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    volunteer_id INTEGER,
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Error creating donations table:', err)
  } else {
    console.log('Donations table created successfully')
    
    // Add some sample data
    const stmt = db.prepare(`
      INSERT INTO donations (campaign_id, donor_name, phone_number, amount, payment_method, transaction_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const sampleDonations = [
      [1, 'Anonymous', '01712345678', 1000, 'bkash', '23532532', 'approved', '2026-01-24 10:30:00'],
      [1, 'John Doe', '01987654321', 500, 'nagad', '45678901', 'pending', '2026-01-25 09:15:00'],
      [1, 'Jane Smith', '01567890123', 2000, 'bkash', '78901234', 'approved', '2026-01-25 14:20:00']
    ]
    
    sampleDonations.forEach(donation => {
      stmt.run(...donation)
    })
    
    stmt.finalize((err) => {
      if (err) {
        console.error('Error inserting sample data:', err)
      } else {
        console.log('Sample donation data inserted')
      }
      db.close()
    })
  }
})

// Also create campaigns table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    wing TEXT,
    status TEXT DEFAULT 'active',
    approval_status TEXT DEFAULT 'approved',
    budget REAL,
    raised REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('Error creating campaigns table:', err)
  } else {
    console.log('Campaigns table created successfully')
    
    // Add sample campaign
    db.run(`
      INSERT OR IGNORE INTO campaigns (id, title, description, wing, status, approval_status, budget, raised)
      VALUES (1, 'Emergency Relief Fund', 'Helping families in need during emergencies', 'Relief Wing', 'active', 'approved', 50000, 3500)
    `, (err) => {
      if (err) {
        console.error('Error inserting sample campaign:', err)
      } else {
        console.log('Sample campaign data inserted')
      }
    })
  }
})