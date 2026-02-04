# UYHO - United Young Help Org

A modern, responsive web application built with React for UYHO (United Young Help Org), a youth-led volunteer organization in Bangladesh.

## 🚀 Features

- ✅ **Fully Responsive Design** - Works on mobile, tablet, and desktop
- ✅ **React-based Architecture** - Easy to extend to React Native for mobile apps
- ✅ **Modern UI/UX** - Built with Tailwind CSS
- ✅ **Dark Mode Support** - Automatic theme switching
- ✅ **Bilingual Content** - English and Bengali (বাংলা) support
- ✅ **Fast Performance** - Powered by Vite for instant HMR

## 📱 Pages

1. **Home** - Hero section, focus areas, impact stories
2. **About Us** - Mission, vision, values, and organizational info
3. **Contact** - Emergency hotline, contact form, office location
4. **Donate** - Donation form with bKash/Nagad payment integration
5. **Join Us** - Volunteer registration form with wing selection
6. **Wings** - Organizational structure and specialized divisions

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Material Symbols
- **Fonts**: Inter, Hind Siliguri (for Bengali)

## 📦 Installation

### Prerequisites

Make sure you have Node.js installed (version 16 or higher):
```bash
node --version
npm --version
```

If not installed, download from [nodejs.org](https://nodejs.org/)

### Setup Steps

1. **Navigate to the project directory**:
```bash
cd "/Users/macbookpro/Library/CloudStorage/GoogleDrive-k241064@student.kent.edu.au/My Drive/UYHO/uyho-web"
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start the development server**:
```bash
npm run dev
```

4. **Open your browser** to `http://localhost:3000`

## 🏗️ Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## 📱 Extending to Mobile Apps (React Native)

This React web app is designed to be easily extended to React Native for iOS and Android:

### Option 1: React Native Web (Unified Codebase)
- Use `react-native-web` to share components between web and mobile
- ~95% code reuse

### Option 2: Separate React Native Project
1. Create new React Native project:
```bash
npx react-native init UYHOMobile
```

2. Reuse components from `src/`:
   - Copy component logic
   - Adapt styling from Tailwind to React Native StyleSheet
   - Use `react-navigation` instead of `react-router-dom`

### Recommended Libraries for Mobile:
- **Navigation**: `@react-navigation/native`
- **Forms**: `react-hook-form`
- **HTTP**: `axios`
- **State Management**: `zustand` or `redux-toolkit`
- **Icons**: `react-native-vector-icons`

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to change the primary color scheme:
```js
colors: {
  primary: "#2ecc71",  // Change this
  teal: "#0d9488",
}
```

### Logo
Replace the SVG logo in:
- `src/components/Header.jsx`
- `src/components/Footer.jsx`

## 📂 Project Structure

```
uyho-web/
├── public/           # Static assets
├── src/
│   ├── components/   # Reusable components
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── pages/        # Page components
│   │   ├── Home.jsx
│   │   ├── About.jsx
│   │   ├── Contact.jsx
│   │   ├── Donate.jsx
│   │   ├── JoinUs.jsx
│   │   └── Wings.jsx
│   ├── App.jsx       # Main app component
│   ├── main.jsx      # Entry point
│   └── index.css     # Global styles
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🌐 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag and drop the 'dist' folder to Netlify
```

### GitHub Pages
```bash
npm install --save-dev gh-pages
# Add to package.json:
# "homepage": "https://yourusername.github.io/uyho"
# "predeploy": "npm run build"
# "deploy": "gh-pages -d dist"
npm run deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is created for UYHO (United Young Help Org) - © 2026

## 📧 Contact

UYHO - United Young Help Org
- Website: [Coming Soon]
- Email: info@uyho.org
- Phone: +880 1XXX-XXXXXX
- Address: Level 4, Youth Center, Gulshan-1, Dhaka 1212, Bangladesh

---

**Made with ❤️ for humanity | মানবতার সেবায় নিয়োজিত**
