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
  
  // Handle INSERT OR REPLACE - convert to INSERT ... ON CONFLICT DO UPDATE
  // This is complex, so we handle specific cases
  if (sql.includes('INSERT OR REPLACE INTO')) {
    // Extract table name and handle common patterns
    const match = sql.match(/INSERT OR REPLACE INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (match) {
      const tableName = match[1];
      const columns = match[2];
      const values = match[3];
      const colArray = columns.split(',').map(c => c.trim());
      
      // Determine the unique constraint columns based on table AND which columns are being inserted
      let conflictColumns = 'id';
      if (tableName === 'pinned_chats') {
        // Check which column is being used - conversation_id or group_id
        if (colArray.includes('group_id')) conflictColumns = 'user_id, group_id';
        else conflictColumns = 'user_id, conversation_id';
      }
      else if (tableName === 'muted_chats') {
        if (colArray.includes('group_id')) conflictColumns = 'user_id, group_id';
        else conflictColumns = 'user_id, conversation_id';
      }
      else if (tableName === 'blocked_users') conflictColumns = 'user_id, blocked_user_id';
      else if (tableName === 'course_ratings') conflictColumns = 'course_id, volunteer_id';
      else if (tableName === 'push_subscriptions') conflictColumns = 'volunteer_id, endpoint';
      else if (tableName === 'wing_members') conflictColumns = 'wing_id, volunteer_id';
      else if (tableName === 'wing_join_requests') conflictColumns = 'wing_id, volunteer_id';
      else if (tableName === 'allies') conflictColumns = 'volunteer_id, ally_id';
      else if (tableName === 'campaign_team') conflictColumns = 'campaign_id, volunteer_id';
      else if (tableName === 'course_enrollments') conflictColumns = 'course_id, volunteer_id';
      else if (tableName === 'volunteer_badges') conflictColumns = 'volunteer_id, badge_id';
      else if (tableName === 'button_access') conflictColumns = 'button_id, user_id';
      else if (tableName === 'group_members') conflictColumns = 'group_id, user_id';
      else if (tableName === 'group_join_requests') conflictColumns = 'group_id, user_id';
      else if (tableName === 'privacy_settings') conflictColumns = 'user_id';
      else if (tableName === 'notification_settings') conflictColumns = 'user_id';
      else if (tableName === 'ummah_funds') conflictColumns = 'entity_type, entity_id';
      
      // Build column update list (excluding the conflict columns)
      const conflictColArray = conflictColumns.split(',').map(c => c.trim());
      const updateCols = colArray.filter(c => !conflictColArray.includes(c));
      const updateSet = updateCols.map(c => `${c} = EXCLUDED.${c}`).join(', ');
      
      if (updateSet) {
        sql = `INSERT INTO ${tableName} (${columns}) VALUES (${values}) ON CONFLICT (${conflictColumns}) DO UPDATE SET ${updateSet}`;
      } else {
        sql = `INSERT INTO ${tableName} (${columns}) VALUES (${values}) ON CONFLICT (${conflictColumns}) DO NOTHING`;
      }
    }
  }
  
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
      specialty VARCHAR(255),
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
      budget_breakdown TEXT,
      logistics TEXT,
      equipment TEXT,
      marketing TEXT,
      collected_amount DOUBLE PRECISION DEFAULT 0,
      raised DOUBLE PRECISION DEFAULT 0,
      goal DOUBLE PRECISION DEFAULT 0,
      volunteers_needed INTEGER DEFAULT 0,
      volunteers_joined INTEGER DEFAULT 0,
      location TEXT,
      category VARCHAR(100),
      wing VARCHAR(100),
      status VARCHAR(50) DEFAULT 'pending',
      approval_status VARCHAR(50) DEFAULT 'pending',
      is_donation INTEGER DEFAULT 0,
      creator_id INTEGER,
      leader_id INTEGER,
      host_id INTEGER,
      wing_id INTEGER,
      hosted_by_wing_id INTEGER,
      hosted_by_name VARCHAR(255),
      requirements TEXT,
      tasks TEXT,
      benefits TEXT,
      tags TEXT,
      urgency VARCHAR(50) DEFAULT 'normal',
      days_left INTEGER DEFAULT 0,
      priority VARCHAR(50) DEFAULT 'normal',
      featured INTEGER DEFAULT 0,
      program_hours INTEGER DEFAULT 0,
      program_respect INTEGER DEFAULT 0,
      lives_impacted INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS campaign_team (
      id SERIAL PRIMARY KEY,
      campaign_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      role VARCHAR(100) DEFAULT 'member',
      task_note TEXT,
      hours INTEGER DEFAULT 0,
      respect INTEGER DEFAULT 0,
      approval_status VARCHAR(50) DEFAULT 'pending',
      status VARCHAR(50) DEFAULT 'active',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (campaign_id, volunteer_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS wings (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      leader_id INTEGER,
      parent_id INTEGER,
      image TEXT,
      location VARCHAR(255),
      created_by INTEGER,
      approval_status VARCHAR(50) DEFAULT 'pending',
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
      user_id INTEGER,
      volunteer_id INTEGER,
      type VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT,
      body TEXT,
      link TEXT,
      url TEXT,
      data TEXT,
      actor_id INTEGER,
      actor_name VARCHAR(255),
      actor_avatar TEXT,
      priority VARCHAR(50) DEFAULT 'normal',
      expires_at TIMESTAMP,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      type VARCHAR(50) DEFAULT 'general',
      author_id INTEGER,
      created_by INTEGER,
      priority VARCHAR(50) DEFAULT 'normal',
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
      page_id VARCHAR(100),
      user_id INTEGER NOT NULL,
      role_type VARCHAR(100),
      role_id INTEGER,
      permissions TEXT,
      can_access INTEGER DEFAULT 1,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      target_id INTEGER,
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
      conversation_id INTEGER,
      group_id INTEGER,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER,
      content TEXT,
      message_type VARCHAR(50) DEFAULT 'text',
      file_url TEXT,
      file_name VARCHAR(255),
      file_size INTEGER,
      is_read INTEGER DEFAULT 0,
      is_delivered INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      reply_to_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      participant1_id INTEGER NOT NULL,
      participant2_id INTEGER NOT NULL,
      last_message_id INTEGER,
      last_message_at TIMESTAMP,
      is_blocked INTEGER DEFAULT 0,
      blocked_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (participant1_id, participant2_id)
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
      icon_url TEXT,
      color VARCHAR(50),
      category VARCHAR(100),
      criteria TEXT,
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
      awarded_by INTEGER,
      note TEXT,
      earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (volunteer_id, badge_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS privacy_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE,
      allies_visibility VARCHAR(50) DEFAULT 'public',
      profile_visibility VARCHAR(50) DEFAULT 'public',
      activity_visibility VARCHAR(50) DEFAULT 'public',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS group_chats (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      avatar TEXT,
      creator_id INTEGER NOT NULL,
      wing_id INTEGER,
      allow_member_add INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS group_members (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      is_admin INTEGER DEFAULT 0,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (group_id, user_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS group_join_requests (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (group_id, user_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS wing_members (
      id SERIAL PRIMARY KEY,
      wing_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      role VARCHAR(100) DEFAULT 'member',
      sort_order INTEGER DEFAULT 0,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (wing_id, volunteer_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS wing_donations (
      id SERIAL PRIMARY KEY,
      wing_id INTEGER NOT NULL,
      volunteer_id INTEGER,
      donor_name VARCHAR(255),
      phone_number VARCHAR(50),
      amount DOUBLE PRECISION NOT NULL,
      payment_method VARCHAR(100),
      transaction_id VARCHAR(255),
      is_anonymous INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS wing_posts (
      id SERIAL PRIMARY KEY,
      wing_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      content TEXT,
      location VARCHAR(255),
      campaign_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS wing_post_images (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    )`,
    
    `CREATE TABLE IF NOT EXISTS wing_post_tags (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      UNIQUE (post_id, volunteer_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS wing_post_reactions (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      reaction_type VARCHAR(50) DEFAULT 'like',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (post_id, volunteer_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS wing_post_comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      parent_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS wing_comment_reactions (
      id SERIAL PRIMARY KEY,
      comment_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      reaction_type VARCHAR(50) DEFAULT 'like',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (comment_id, volunteer_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS wing_join_requests (
      id SERIAL PRIMARY KEY,
      wing_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      reviewed_by INTEGER,
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (wing_id, volunteer_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS course_lessons (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      duration_minutes INTEGER DEFAULT 10,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS course_questions (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      answer TEXT,
      answered_by INTEGER,
      answered_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS notification_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE,
      email_notifications INTEGER DEFAULT 1,
      push_notifications INTEGER DEFAULT 1,
      campaign_notifications INTEGER DEFAULT 1,
      ally_notifications INTEGER DEFAULT 1,
      announcement_notifications INTEGER DEFAULT 1,
      chat_notifications INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS direct_aids (
      id SERIAL PRIMARY KEY,
      volunteer_id INTEGER,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      goal_amount DOUBLE PRECISION DEFAULT 0,
      raised_amount DOUBLE PRECISION DEFAULT 0,
      image TEXT,
      beneficiary_name VARCHAR(255),
      bio TEXT,
      life_history TEXT,
      status VARCHAR(50) DEFAULT 'active',
      approval_status VARCHAR(50) DEFAULT 'pending',
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS direct_aid_team (
      id SERIAL PRIMARY KEY,
      direct_aid_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      role VARCHAR(100) DEFAULT 'member',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (direct_aid_id, volunteer_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS direct_aid_donations (
      id SERIAL PRIMARY KEY,
      direct_aid_id INTEGER NOT NULL,
      donor_name VARCHAR(255),
      phone_number VARCHAR(50),
      amount DOUBLE PRECISION NOT NULL,
      payment_method VARCHAR(100),
      transaction_id VARCHAR(255),
      is_anonymous INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      volunteer_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS direct_aid_updates (
      id SERIAL PRIMARY KEY,
      direct_aid_id INTEGER NOT NULL,
      content TEXT,
      images TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS ummah_funds (
      id SERIAL PRIMARY KEY,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INTEGER NOT NULL,
      balance DOUBLE PRECISION DEFAULT 0,
      total_in DOUBLE PRECISION DEFAULT 0,
      total_out DOUBLE PRECISION DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (entity_type, entity_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS fund_transactions (
      id SERIAL PRIMARY KEY,
      from_type VARCHAR(50),
      from_id INTEGER,
      to_type VARCHAR(50),
      to_id INTEGER,
      amount DOUBLE PRECISION NOT NULL,
      note TEXT,
      transaction_type VARCHAR(50),
      status VARCHAR(50) DEFAULT 'completed',
      created_by INTEGER,
      donation_id INTEGER,
      expense_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      amount DOUBLE PRECISION NOT NULL,
      category VARCHAR(100),
      invoice_image TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_by INTEGER,
      approved_by INTEGER,
      approved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS pinned_chats (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      conversation_id INTEGER,
      group_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, conversation_id),
      UNIQUE (user_id, group_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS muted_chats (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      conversation_id INTEGER,
      group_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, conversation_id),
      UNIQUE (user_id, group_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS blocked_users (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      blocked_user_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, blocked_user_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS course_ratings (
      id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL,
      volunteer_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      review TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (course_id, volunteer_id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      volunteer_id INTEGER NOT NULL,
      endpoint TEXT NOT NULL,
      keys TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (volunteer_id, endpoint)
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

    // Update existing allies to have 'accepted' status
    try {
      await client.query("UPDATE allies SET status = 'accepted' WHERE status = 'pending' OR status IS NULL");
    } catch (err) {
      // Ignore if error
    }

    // Add missing columns to wings table
    try {
      await client.query("ALTER TABLE wings ADD COLUMN IF NOT EXISTS location VARCHAR(255)");
      await client.query("ALTER TABLE wings ADD COLUMN IF NOT EXISTS created_by INTEGER");
      await client.query("ALTER TABLE wings ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending'");
      await client.query("ALTER TABLE wings ADD COLUMN IF NOT EXISTS decline_reason TEXT");
      await client.query("ALTER TABLE wings ADD COLUMN IF NOT EXISTS reviewed_by INTEGER");
      await client.query("ALTER TABLE wings ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing columns to volunteers table
    try {
      await client.query("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS last_active TIMESTAMP");
      await client.query("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS respect_points INTEGER DEFAULT 0");
      await client.query("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS donation_points INTEGER DEFAULT 0");
      await client.query("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS total_hours INTEGER DEFAULT 0");
      await client.query("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS total_respect INTEGER DEFAULT 0");
      await client.query("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS total_donated DOUBLE PRECISION DEFAULT 0");
      await client.query("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS total_collected DOUBLE PRECISION DEFAULT 0");
      await client.query("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS monthly_hours INTEGER DEFAULT 0");
      await client.query("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS monthly_donations DOUBLE PRECISION DEFAULT 0");
      await client.query("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS monthly_collected DOUBLE PRECISION DEFAULT 0");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing columns to messages table for conversations
    try {
      await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id INTEGER");
      await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS group_id INTEGER");
      await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text'");
      await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER");
      await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_delivered INTEGER DEFAULT 0");
      await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_pinned INTEGER DEFAULT 0");
      await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing columns to campaigns table
    try {
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS wing VARCHAR(100)");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget_breakdown TEXT");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS logistics TEXT");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS equipment TEXT");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS marketing TEXT");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS host_id INTEGER");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS hosted_by_wing_id INTEGER");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS hosted_by_name VARCHAR(255)");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending'");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS goal DOUBLE PRECISION DEFAULT 0");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS raised DOUBLE PRECISION DEFAULT 0");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS days_left INTEGER DEFAULT 0");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS urgency VARCHAR(50) DEFAULT 'normal'");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS program_hours INTEGER DEFAULT 0");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS program_respect INTEGER DEFAULT 0");
      await client.query("ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS lives_impacted INTEGER DEFAULT 0");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing columns to campaign_team table
    try {
      await client.query("ALTER TABLE campaign_team ADD COLUMN IF NOT EXISTS task_note TEXT");
      await client.query("ALTER TABLE campaign_team ADD COLUMN IF NOT EXISTS hours INTEGER DEFAULT 0");
      await client.query("ALTER TABLE campaign_team ADD COLUMN IF NOT EXISTS respect INTEGER DEFAULT 0");
      await client.query("ALTER TABLE campaign_team ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending'");
      await client.query("ALTER TABLE campaign_team ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing columns to team_members table
    try {
      await client.query("ALTER TABLE team_members ADD COLUMN IF NOT EXISTS specialty VARCHAR(255)");
    } catch (err) {
      // Columns may already exist
    }

    // Fix messages table - allow null content for file messages
    try {
      await client.query("ALTER TABLE messages ALTER COLUMN content DROP NOT NULL");
    } catch (err) {
      // Constraint may not exist or already removed
    }

    // Fix wings approval_status - ensure it defaults to pending
    try {
      await client.query("ALTER TABLE wings ALTER COLUMN approval_status SET DEFAULT 'pending'");
      // Set any null approval_status to pending
      await client.query("UPDATE wings SET approval_status = 'pending' WHERE approval_status IS NULL");
    } catch (err) {
      // Column may already have default
    }

    // Add missing columns to notifications table
    try {
      await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS volunteer_id INTEGER");
      await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS body TEXT");
      await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS url TEXT");
      await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data TEXT");
      await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_id INTEGER");
      await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_name VARCHAR(255)");
      await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_avatar TEXT");
      await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'normal'");
      await client.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing columns to announcements table
    try {
      await client.query("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by INTEGER");
      await client.query("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'normal'");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing columns to badges table
    try {
      await client.query("ALTER TABLE badges ADD COLUMN IF NOT EXISTS icon_url TEXT");
      await client.query("ALTER TABLE badges ADD COLUMN IF NOT EXISTS criteria TEXT");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing columns to volunteer_badges table
    try {
      await client.query("ALTER TABLE volunteer_badges ADD COLUMN IF NOT EXISTS awarded_by INTEGER");
      await client.query("ALTER TABLE volunteer_badges ADD COLUMN IF NOT EXISTS note TEXT");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing columns to access_settings table
    try {
      await client.query("ALTER TABLE access_settings ADD COLUMN IF NOT EXISTS role_type VARCHAR(100)");
      await client.query("ALTER TABLE access_settings ADD COLUMN IF NOT EXISTS role_id INTEGER");
      await client.query("ALTER TABLE access_settings ADD COLUMN IF NOT EXISTS permissions TEXT");
      await client.query("ALTER TABLE access_settings ADD COLUMN IF NOT EXISTS created_by INTEGER");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing columns to access_logs table
    try {
      await client.query("ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS target_id INTEGER");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing columns to courses table
    try {
      await client.query("ALTER TABLE courses ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved'");
      await client.query("ALTER TABLE courses ADD COLUMN IF NOT EXISTS badge VARCHAR(255)");
      await client.query("ALTER TABLE courses ADD COLUMN IF NOT EXISTS slide_file TEXT");
      await client.query("ALTER TABLE courses ADD COLUMN IF NOT EXISTS slide_file_name VARCHAR(255)");
      await client.query("ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_hours DOUBLE PRECISION DEFAULT 1.0");
      await client.query("ALTER TABLE courses ADD COLUMN IF NOT EXISTS lessons_count INTEGER DEFAULT 1");
      await client.query("ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_design INTEGER DEFAULT 1");
      await client.query("ALTER TABLE courses ADD COLUMN IF NOT EXISTS quiz_questions TEXT");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing columns to direct_aids table
    try {
      await client.query("ALTER TABLE direct_aids ADD COLUMN IF NOT EXISTS requester_id INTEGER");
      // Copy existing volunteer_id to requester_id for consistency
      await client.query("UPDATE direct_aids SET requester_id = volunteer_id WHERE requester_id IS NULL AND volunteer_id IS NOT NULL");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing columns to donations table
    try {
      await client.query("ALTER TABLE donations ADD COLUMN IF NOT EXISTS referrer_id INTEGER");
    } catch (err) {
      // Columns may already exist
    }

    // Add missing unique constraints for pinned_chats and muted_chats tables
    try {
      await client.query("CREATE UNIQUE INDEX IF NOT EXISTS pinned_chats_user_group_idx ON pinned_chats (user_id, group_id) WHERE group_id IS NOT NULL");
      await client.query("CREATE UNIQUE INDEX IF NOT EXISTS muted_chats_user_group_idx ON muted_chats (user_id, group_id) WHERE group_id IS NOT NULL");
    } catch (err) {
      // Index may already exist
    }

    // Backfill 'joined' activity for volunteers who don't have it
    try {
      await client.query(`
        INSERT INTO activities (volunteer_id, activity_type, description, created_at)
        SELECT v.id, 'joined', 'Joined UYHO as a volunteer', v.created_at
        FROM volunteers v
        WHERE NOT EXISTS (
          SELECT 1 FROM activities a 
          WHERE a.volunteer_id = v.id AND a.activity_type = 'joined'
        )
      `);
      console.log('[PostgreSQL] Backfilled joined activities for existing volunteers');
    } catch (err) {
      console.log('[PostgreSQL] Activity backfill skipped or already done');
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
