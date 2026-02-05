import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

let pool = null;
let isConnected = false;

// Initialize PostgreSQL connection pool
function createPool() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('[PostgreSQL] DATABASE_URL not found in environment variables');
    return null;
  }

  return new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

pool = createPool();

// Create db object with methods matching the existing API
const db = {
  run: function(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    const pgSql = convertToPostgreSQL(sql);
    const pgParams = convertParams(params);
    
    pool.query(pgSql, pgParams)
      .then(result => {
        if (callback) {
          callback.call({ 
            lastID: result.rows[0]?.id || result.rowCount, 
            changes: result.rowCount 
          }, null);
        }
      })
      .catch(err => {
        console.error('[PostgreSQL] Run error:', err.message);
        if (callback) callback(err);
      });
  },

  get: function(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    const pgSql = convertToPostgreSQL(sql);
    const pgParams = convertParams(params);
    
    pool.query(pgSql, pgParams)
      .then(result => {
        if (callback) callback(null, result.rows[0] || null);
      })
      .catch(err => {
        console.error('[PostgreSQL] Get error:', err.message);
        if (callback) callback(err, null);
      });
  },

  all: function(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    const pgSql = convertToPostgreSQL(sql);
    const pgParams = convertParams(params);
    
    pool.query(pgSql, pgParams)
      .then(result => {
        if (callback) callback(null, result.rows || []);
      })
      .catch(err => {
        console.error('[PostgreSQL] All error:', err.message);
        if (callback) callback(err, []);
      });
  },

  exec: function(sql, callback) {
    pool.query(sql)
      .then(() => {
        if (callback) callback(null);
      })
      .catch(err => {
        console.error('[PostgreSQL] Exec error:', err.message);
        if (callback) callback(err);
      });
  },

  prepare: function(sql) {
    const pgSql = convertToPostgreSQL(sql);
    return {
      run: function(...args) {
        const params = args.slice(0, -1);
        const cb = args[args.length - 1];
        const pgParams = convertParams(params);
        
        pool.query(pgSql, pgParams)
          .then(result => {
            if (typeof cb === 'function') {
              cb.call({ 
                lastID: result.rows[0]?.id || result.rowCount, 
                changes: result.rowCount 
              }, null);
            }
          })
          .catch(err => {
            if (typeof cb === 'function') cb(err);
          });
      },
      finalize: function(callback) {
        if (callback) callback(null);
      }
    };
  },

  close: function(callback) {
    pool.end()
      .then(() => {
        if (callback) callback(null);
      })
      .catch(err => {
        if (callback) callback(err);
      });
  },

  serialize: function(callback) {
    // PostgreSQL doesn't need serialization, just execute callback
    if (callback) callback();
  }
};

// Convert SQLite/MySQL syntax to PostgreSQL
function convertToPostgreSQL(sql) {
  let paramIndex = 0;
  return sql
    // Handle AUTOINCREMENT -> SERIAL (but not in INSERT statements)
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
    .replace(/INT PRIMARY KEY AUTO_INCREMENT/gi, 'SERIAL PRIMARY KEY')
    // Handle MySQL-specific syntax
    .replace(/AUTO_INCREMENT/gi, '')
    // Handle datetime functions
    .replace(/datetime\('now'\)/gi, 'NOW()')
    .replace(/date\('now'\)/gi, 'CURRENT_DATE')
    .replace(/CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/gi, 'CURRENT_TIMESTAMP')
    // Handle boolean integers
    .replace(/\bINTEGER DEFAULT 0\b/gi, 'INTEGER DEFAULT 0')
    .replace(/\bINT DEFAULT 0\b/gi, 'INTEGER DEFAULT 0')
    // Handle REAL to DOUBLE PRECISION
    .replace(/\bREAL\b/gi, 'DOUBLE PRECISION')
    .replace(/\bDOUBLE\b(?!\s+PRECISION)/gi, 'DOUBLE PRECISION')
    // Handle MySQL UNIQUE KEY syntax
    .replace(/UNIQUE KEY \w+ /gi, 'UNIQUE ')
    // Handle SQLite PRAGMA (ignore them)
    .replace(/PRAGMA[^;]*/gi, 'SELECT 1')
    // Convert ? placeholders to $1, $2, etc.
    .replace(/\?/g, () => `$${++paramIndex}`);
}

// Convert params array (handle any type conversions if needed)
function convertParams(params) {
  if (!Array.isArray(params)) return [];
  return params.map(p => {
    if (p === undefined) return null;
    return p;
  });
}

// Test PostgreSQL connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    isConnected = true;
    console.log('[PostgreSQL] Connected to Neon database successfully!');
    return true;
  } catch (err) {
    console.error('[PostgreSQL] Connection error:', err.message);
    isConnected = false;
    return false;
  }
}

// Initialize database tables (PostgreSQL version)
export async function initializeMySQLDatabase() {
  console.log('[PostgreSQL] Initializing database tables...');

  const tables = [
    `CREATE TABLE IF NOT EXISTS volunteers (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      password VARCHAR(255) NOT NULL,
      digital_id VARCHAR(50) UNIQUE,
      wing VARCHAR(100),
      position VARCHAR(100),
      avatar TEXT,
      bio TEXT,
      blood_group VARCHAR(10),
      date_of_birth DATE,
      age INTEGER,
      education TEXT,
      address TEXT,
      city VARCHAR(100),
      country VARCHAR(100),
      postal_code VARCHAR(20),
      join_date DATE,
      availability TEXT DEFAULT '[]',
      emergency_name VARCHAR(255),
      emergency_phone VARCHAR(50),
      emergency_relation VARCHAR(100),
      shirt_size VARCHAR(10),
      dietary_restrictions TEXT,
      medical_conditions TEXT,
      skills TEXT,
      languages TEXT,
      interests TEXT,
      occupation VARCHAR(255),
      employer VARCHAR(255),
      linkedin VARCHAR(255),
      twitter VARCHAR(255),
      facebook VARCHAR(255),
      instagram VARCHAR(255),
      website VARCHAR(255),
      status VARCHAR(50) DEFAULT 'Active',
      points INTEGER DEFAULT 0,
      hours_given INTEGER DEFAULT 0,
      lives_impacted INTEGER DEFAULT 0,
      teams_led INTEGER DEFAULT 0,
      role VARCHAR(50) DEFAULT 'volunteer',
      badges TEXT DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      position VARCHAR(255),
      category VARCHAR(50) DEFAULT 'current',
      avatar TEXT,
      bio TEXT,
      email VARCHAR(255),
      phone VARCHAR(50),
      wing VARCHAR(100),
      status VARCHAR(50) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS campaigns (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      image TEXT,
      start_date DATE,
      end_date DATE,
      event_date DATE,
      budget DOUBLE PRECISION DEFAULT 0,
      collected_amount DOUBLE PRECISION DEFAULT 0,
      volunteers_needed INTEGER DEFAULT 0,
      volunteers_joined INTEGER DEFAULT 0,
      location TEXT,
      category VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      is_donation INTEGER DEFAULT 0,
      creator_id INTEGER,
      leader_id INTEGER,
      wing_id INTEGER,
      requirements TEXT,
      tasks TEXT,
      benefits TEXT,
      tags TEXT,
      priority VARCHAR(50) DEFAULT 'normal',
      featured INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS campaign_team (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      role VARCHAR(100) DEFAULT 'member',
      status VARCHAR(50) DEFAULT 'active',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (campaign_id, volunteer_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS wings (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      leader_id INTEGER,
      parent_id INTEGER,
      image TEXT,
      members_count INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS donations (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER NOT NULL,
      donor_name VARCHAR(255) NOT NULL,
      phone_number VARCHAR(50),
      amount DOUBLE PRECISION NOT NULL,
      payment_method VARCHAR(100) NOT NULL,
      transaction_id VARCHAR(255) NOT NULL,
      is_anonymous INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      volunteer_id INTEGER,
      verified_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      type VARCHAR(50) DEFAULT 'general',
      author_id INTEGER,
      pinned INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS organization_settings (
      id SERIAL PRIMARY KEY,
      org_name VARCHAR(100) DEFAULT 'UYHO',
      org_full_name VARCHAR(255) DEFAULT 'United Young Help Organization',
      org_description TEXT,
      logo TEXT,
      favicon TEXT,
      primary_color VARCHAR(20) DEFAULT '#10b981',
      secondary_color VARCHAR(20) DEFAULT '#065f46',
      contact_email VARCHAR(255),
      contact_phone VARCHAR(50),
      address TEXT,
      website_url VARCHAR(255),
      facebook_url VARCHAR(255),
      twitter_url VARCHAR(255),
      instagram_url VARCHAR(255),
      linkedin_url VARCHAR(255),
      youtube_url VARCHAR(255),
      founded_year INTEGER,
      mission_statement TEXT,
      vision_statement TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      image TEXT,
      category VARCHAR(100),
      duration VARCHAR(100),
      instructor_id INTEGER,
      instructor_name VARCHAR(255),
      level VARCHAR(50) DEFAULT 'beginner',
      status VARCHAR(50) DEFAULT 'active',
      enrollment_count INTEGER DEFAULT 0,
      completion_count INTEGER DEFAULT 0,
      rating DOUBLE PRECISION DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      syllabus TEXT,
      requirements TEXT,
      objectives TEXT,
      is_certificate INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS course_enrollments (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'enrolled',
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      certificate_id VARCHAR(255),
      UNIQUE (course_id, volunteer_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS organization_roles (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(50) NOT NULL DEFAULT 'general',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS access_settings (
      id SERIAL PRIMARY KEY,
      page_id VARCHAR(100) NOT NULL,
      user_id INTEGER NOT NULL,
      can_access INTEGER DEFAULT 1,
      updated_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (page_id, user_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS button_access (
      id SERIAL PRIMARY KEY,
      button_id VARCHAR(100) NOT NULL,
      user_id INTEGER NOT NULL,
      updated_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (button_id, user_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS access_logs (
      id SERIAL PRIMARY KEY,
      action_type VARCHAR(100) NOT NULL,
      action_description TEXT,
      actor_id INTEGER,
      target_type VARCHAR(100),
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      volunteer_id INTEGER NOT NULL,
      activity_type VARCHAR(100) NOT NULL,
      description TEXT,
      campaign_id INTEGER,
      campaign_title VARCHAR(255),
      wing_id INTEGER,
      role VARCHAR(100),
      badge_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS allies (
      id SERIAL PRIMARY KEY,
      volunteer_id INTEGER NOT NULL,
      ally_id INTEGER NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (volunteer_id, ally_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'text',
      file_url TEXT,
      file_name VARCHAR(255),
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS programs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      image TEXT,
      category VARCHAR(100),
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) DEFAULT 'active',
      participants_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS badges (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      icon TEXT,
      color VARCHAR(50),
      category VARCHAR(100),
      points_required INTEGER DEFAULT 0,
      hours_required INTEGER DEFAULT 0,
      campaigns_required INTEGER DEFAULT 0,
      is_special INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS volunteer_badges (
      id SERIAL PRIMARY KEY,
      volunteer_id INTEGER NOT NULL,
      badge_id INTEGER NOT NULL,
      earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (volunteer_id, badge_id)
    )`
  ];

  const client = await pool.connect();
  
  try {
    for (const tableSQL of tables) {
      try {
        await client.query(tableSQL);
      } catch (err) {
        console.error('[PostgreSQL] Error creating table:', err.message);
      }
    }

    // Insert default org settings if not exists
    try {
      const result = await client.query('SELECT COUNT(*) as count FROM organization_settings');
      if (parseInt(result.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO organization_settings (org_name, org_full_name, org_description, contact_email, website_url)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          'UYHO',
          'United Young Help Organization',
          'United Young Help Organization (UYHO) is a youth-led nonprofit dedicated to empowering communities.',
          'contact@uyho.org',
          'https://uyho.org'
        ]);
      }
    } catch (err) {
      // Ignore if already exists
    }

    console.log('[PostgreSQL] Database initialization complete!');
  } finally {
    client.release();
  }
}

// Check if using PostgreSQL (always true now)
export function isUsingMySQL() {
  return true; // For backward compatibility
}

export { pool };
export default db;
