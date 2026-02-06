import { createClient } from '@libsql/client';
import 'dotenv/config';

// Turso/libSQL client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://uyho-web-deburgermaster-afk.aws-ap-south-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN
});

let isConnected = false;

// Create db object with methods matching SQLite API (your original code)
const db = {
  run: function(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    client.execute({ sql, args: params || [] })
      .then(result => {
        if (callback) {
          callback.call({ 
            lastID: result.lastInsertRowid ? Number(result.lastInsertRowid) : 0, 
            changes: result.rowsAffected || 0 
          }, null);
        }
      })
      .catch(err => {
        console.error('[Turso] Run error:', err.message, 'SQL:', sql.substring(0, 100));
        if (callback) callback(err);
      });
  },

  get: function(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    client.execute({ sql, args: params || [] })
      .then(result => {
        if (callback) callback(null, result.rows[0] || null);
      })
      .catch(err => {
        console.error('[Turso] Get error:', err.message, 'SQL:', sql.substring(0, 100));
        if (callback) callback(err, null);
      });
  },

  all: function(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    client.execute({ sql, args: params || [] })
      .then(result => {
        if (callback) callback(null, result.rows || []);
      })
      .catch(err => {
        console.error('[Turso] All error:', err.message, 'SQL:', sql.substring(0, 100));
        if (callback) callback(err, []);
      });
  },

  exec: function(sql, callback) {
    // For multi-statement execution
    client.executeMultiple(sql)
      .then(() => {
        if (callback) callback(null);
      })
      .catch(err => {
        console.error('[Turso] Exec error:', err.message);
        if (callback) callback(err);
      });
  },

  serialize: function(fn) {
    // libSQL handles serialization automatically
    if (fn) fn();
  },

  prepare: function(sql) {
    return {
      run: function(...args) {
        const params = args.slice(0, -1);
        const cb = args[args.length - 1];
        
        client.execute({ sql, args: params || [] })
          .then(result => {
            if (typeof cb === 'function') {
              cb.call({ 
                lastID: result.lastInsertRowid ? Number(result.lastInsertRowid) : 0, 
                changes: result.rowsAffected || 0 
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
    client.close();
    if (callback) callback(null);
  }
};

// Test connection
export async function testConnection() {
  try {
    await client.execute('SELECT 1');
    isConnected = true;
    console.log('[Turso] Connected to database successfully!');
    return true;
  } catch (err) {
    console.error('[Turso] Connection error:', err.message);
    isConnected = false;
    return false;
  }
}

// Initialize database - runs table creation
export async function initializeMySQLDatabase() {
  console.log('[Turso] Initializing database tables...');
  
  try {
    // Tables will be created from the imported SQLite dump
    // Just verify connection
    await client.execute('SELECT 1');
    console.log('[Turso] Database ready!');
    isConnected = true;
  } catch (error) {
    console.error('[Turso] Database initialization error:', error);
    throw error;
  }
}

// For backward compatibility
export function isUsingMySQL() {
  return false; // Now using SQLite/Turso
}

export { client };
export default db;
