import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useOrg } from '../context/OrgContext'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { orgData } = useOrg()

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img 
            alt={`${orgData.org_name} Logo`}
            className="h-12 w-auto" 
            src="/logo.png"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
            Home
          </Link>
          <Link to="/about" className={`text-sm font-medium transition-colors ${isActive('/about') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
            About Us
          </Link>
          <Link to="/wings" className={`text-sm font-medium transition-colors ${isActive('/wings') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
            Wings
          </Link>
          <Link to="/campaigns" className={`text-sm font-medium transition-colors ${isActive('/campaigns') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
            Campaigns
          </Link>
          <Link to="/donations" className={`text-sm font-medium transition-colors ${isActive('/donations') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
            Donations
          </Link>
          <Link to="/donate" className={`text-sm font-medium transition-colors ${isActive('/donate') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
            Donate
          </Link>
          <Link to="/downloads" className={`text-sm font-medium transition-colors ${isActive('/downloads') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
            Downloads
          </Link>
          <Link to="/ebr" className={`text-sm font-medium transition-colors flex items-center gap-1 ${isActive('/ebr') ? 'text-red-600' : 'text-slate-600 dark:text-slate-300 hover:text-red-600'}`}>
            <span className="text-red-500">🩸</span> Blood Donation
          </Link>
          <Link to="/join" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
            Join Us
          </Link>
          <Link to="/volunteer/login" className={`text-sm font-medium transition-colors ${isActive('/volunteer/login') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
            Login
          </Link>
          <Link to="/contact" className={`text-sm font-medium transition-colors ${isActive('/contact') ? 'text-primary' : 'text-slate-600 dark:text-slate-300 hover:text-primary'}`}>
            Contact
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-slate-600 dark:text-slate-300"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <nav className="flex flex-col p-4 space-y-2">
            <Link to="/" className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded" onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <Link to="/about" className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded" onClick={() => setMenuOpen(false)}>
              About Us
            </Link>
            <Link to="/wings" className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded" onClick={() => setMenuOpen(false)}>
              Wings
            </Link>
            <Link to="/campaigns" className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded" onClick={() => setMenuOpen(false)}>
              Campaigns
            </Link>
            <Link to="/donations" className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded" onClick={() => setMenuOpen(false)}>
              Donations
            </Link>
            <Link to="/donate" className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded" onClick={() => setMenuOpen(false)}>
              Donate
            </Link>
            <Link to="/downloads" className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded" onClick={() => setMenuOpen(false)}>
              Downloads
            </Link>
            <Link to="/ebr" className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-2" onClick={() => setMenuOpen(false)}>
              <span>🩸</span> Blood Donation
            </Link>
            <Link to="/join" className="px-4 py-2 text-sm font-bold bg-primary text-white rounded hover:bg-primary/90" onClick={() => setMenuOpen(false)}>
              Join Us
            </Link>
            <Link to="/volunteer/login" className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
            <Link to="/contact" className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
