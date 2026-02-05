// Script to add organization roles to Neon database

const roles = [
  // Central Executive Committee Roles (15 roles)
  { title: 'Chief Coordinator', description: 'Highest authority responsible for overall organizational leadership, strategic vision, and decision making', category: 'executive', sort_order: 1 },
  { title: 'Executive Director', description: 'Manages day-to-day operations and ensures execution of organizational strategies', category: 'executive', sort_order: 2 },
  { title: 'Deputy Director', description: 'Assists the Executive Director and oversees special projects', category: 'executive', sort_order: 3 },
  { title: 'General Secretary', description: 'Handles all administrative duties, correspondence, and record keeping', category: 'executive', sort_order: 4 },
  { title: 'Joint Secretary', description: 'Assists the General Secretary in administrative functions', category: 'executive', sort_order: 5 },
  { title: 'Treasurer', description: 'Manages all financial operations, budgets, and fund allocation', category: 'executive', sort_order: 6 },
  { title: 'Finance Secretary', description: 'Assists treasurer with financial records and reporting', category: 'executive', sort_order: 7 },
  { title: 'Organizing Secretary', description: 'Plans and coordinates events, campaigns, and activities', category: 'executive', sort_order: 8 },
  { title: 'Public Relations Officer', description: 'Manages external communications, media relations, and public image', category: 'executive', sort_order: 9 },
  { title: 'Information & Technology Secretary', description: 'Oversees digital platforms, technology infrastructure, and IT operations', category: 'executive', sort_order: 10 },
  { title: 'Research & Development Secretary', description: 'Leads research initiatives and strategic development projects', category: 'executive', sort_order: 11 },
  { title: 'Training & Development Secretary', description: 'Manages volunteer training programs and skill development', category: 'executive', sort_order: 12 },
  { title: 'Welfare Secretary', description: 'Oversees member welfare and support programs', category: 'executive', sort_order: 13 },
  { title: 'Legal Advisor', description: 'Provides legal guidance and ensures regulatory compliance', category: 'executive', sort_order: 14 },
  { title: 'Executive Member', description: 'Participates in executive decisions and represents organizational interests', category: 'executive', sort_order: 15 },
  
  // General Members Structure (5 levels)
  { title: 'Senior Volunteer', description: 'Experienced volunteer with leadership responsibilities and mentorship duties', category: 'general', sort_order: 1 },
  { title: 'Active Volunteer', description: 'Regular volunteer actively participating in campaigns and programs', category: 'general', sort_order: 2 },
  { title: 'Volunteer', description: 'Standard volunteer member contributing to organizational activities', category: 'general', sort_order: 3 },
  { title: 'Trainee Volunteer', description: 'New volunteer undergoing orientation and basic training', category: 'general', sort_order: 4 },
  { title: 'Supporter', description: 'Associate member supporting the organization through donations or advocacy', category: 'general', sort_order: 5 }
];

import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTableAndAddRoles() {
  const client = await pool.connect();
  
  try {
    console.log('Creating organization_roles table...\n');
    
    // Create the table
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_roles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL DEFAULT 'general',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Table created successfully\n');
    
    // Clear existing roles to avoid duplicates
    await client.query('DELETE FROM organization_roles');
    console.log('✓ Cleared existing roles\n');
    
    console.log('Adding roles to database...\n');
    
    for (const role of roles) {
      try {
        await client.query(
          'INSERT INTO organization_roles (title, description, category, sort_order) VALUES ($1, $2, $3, $4)',
          [role.title, role.description, role.category, role.sort_order]
        );
        console.log(`${role.category.toUpperCase()} - ${role.title}: ✓ Added`);
      } catch (err) {
        console.log(`${role.category.toUpperCase()} - ${role.title}: ✗ Error - ${err.message}`);
      }
    }
    
    console.log('\n✓ Done! All roles have been added to the database.');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createTableAndAddRoles();
