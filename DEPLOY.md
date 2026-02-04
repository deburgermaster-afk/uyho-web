# UYHO Web - Deployment Guide
1st feb
## Quick Deployment Steps

### 1. Upload Files
Upload all files from this package to your hosting server.

### 2. Configure Database
1. Create a MySQL database on your hosting panel (e.g., `uyho_db`)
2. Create a database user with full privileges
3. Copy `.env.example` to `.env` and fill in your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
PORT=5000
NODE_ENV=production
```

### 3. Install Dependencies
Run in your server terminal:
```bash
npm install --production
```

### 4. Start the Server
For testing:
```bash
node server.js
```

For production (with PM2):
```bash
npm install -g pm2
pm2 start server.js --name "uyho-web"
pm2 save
pm2 startup
```

### 5. Configure Web Server (Apache/Nginx)

#### For Apache (add to .htaccess or virtual host):
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]
```

#### For Nginx:
```nginx
location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## File Structure
```
uyho-web/
├── dist/           # Built frontend (production)
├── public/         # Static files (uploads, avatars, etc.)
│   ├── avatars/    # User avatars
│   ├── chat-files/ # Chat attachments
│   ├── course-slides/
│   ├── icons/
│   ├── post-images/
│   └── post-videos/
├── server.js       # Backend API server
├── db.js          # Database connection (MySQL)
├── package.json   # Dependencies
├── .env           # Your configuration (create from .env.example)
└── .env.example   # Configuration template
```

## Database
The server will automatically create all required tables on first run.
No manual SQL import needed!

## Troubleshooting

### Server won't start
- Check MySQL credentials in `.env`
- Ensure port 5000 is available
- Check Node.js version (requires 18+)

### Database connection failed
- Verify MySQL is running
- Check database name, user, and password
- Ensure user has proper privileges

### Pages show blank/errors
- Check if `dist/` folder exists
- Rebuild frontend: `npm run build`
- Check browser console for errors

## Support
For issues, check the logs:
```bash
pm2 logs uyho-web
```
