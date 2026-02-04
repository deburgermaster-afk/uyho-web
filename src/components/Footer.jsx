import { Link } from 'react-router-dom'
import { useOrg } from '../context/OrgContext'

export default function Footer() {
  const { orgData } = useOrg()

  const socialLinks = [
    { key: 'facebook_url', icon: 'fa-facebook-f', label: 'Facebook' },
    { key: 'instagram_url', icon: 'fa-instagram', label: 'Instagram' },
    { key: 'twitter_url', icon: 'fa-x-twitter', label: 'Twitter' },
    { key: 'linkedin_url', icon: 'fa-linkedin-in', label: 'LinkedIn' },
    { key: 'youtube_url', icon: 'fa-youtube', label: 'YouTube' },
    { key: 'tiktok_url', icon: 'fa-tiktok', label: 'TikTok' },
  ].filter(link => orgData[link.key])

  return (
    <footer className="bg-slate-950 text-slate-400 py-16 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <img 
              alt={`${orgData.org_name} Logo`}
              className="h-8 w-auto" 
              src="/logo.png"
            />
          </div>
          <p className="text-sm leading-relaxed mb-8 opacity-80 max-w-2xl">
            {orgData.org_description || `${orgData.org_full_name} is a non-profit organization dedicated to creating sustainable impact through community-driven projects.`}
          </p>
          <div className="flex gap-4">
            {socialLinks.length > 0 ? (
              socialLinks.map(link => (
                <a 
                  key={link.key}
                  className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-primary hover:text-white transition" 
                  href={orgData[link.key]} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title={link.label}
                >
                  <i className={`fa-brands ${link.icon} text-lg`}></i>
                </a>
              ))
            ) : (
              <a 
                className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-primary hover:text-white transition" 
                href={orgData.website_url || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <span className="material-symbols-outlined text-lg">language</span>
              </a>
            )}
            {orgData.contact_email && (
              <a 
                className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-primary hover:text-white transition" 
                href={`mailto:${orgData.contact_email}`}
              >
                <span className="material-symbols-outlined text-lg">mail</span>
              </a>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-xs">
          <div>
            <h5 className="text-white font-bold uppercase tracking-widest mb-5">Quick Links</h5>
            <ul className="space-y-3">
              <li><Link to="/about" className="hover:text-primary transition">About Us</Link></li>
              <li><Link to="/wings" className="hover:text-primary transition">Our Wings</Link></li>
              <li><Link to="/join" className="hover:text-primary transition">Join Us</Link></li>
              <li><Link to="/donate" className="hover:text-primary transition">Donate</Link></li>
              <li><Link to="/activities" className="hover:text-primary transition">Activities</Link></li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-white font-bold uppercase tracking-widest mb-5">Programs</h5>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-primary transition">Education Wing</a></li>
              <li><a href="#" className="hover:text-primary transition">Healthcare</a></li>
              <li><a href="#" className="hover:text-primary transition">Disaster Relief</a></li>
              <li><a href="#" className="hover:text-primary transition">Community Development</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-white font-bold uppercase tracking-widest mb-5">Contact</h5>
            <ul className="space-y-3">
              {orgData.contact_address ? (
                orgData.contact_address.split('\n').map((line, i) => (
                  <li key={i}>{line}</li>
                ))
              ) : (
                <>
                  <li>Level 4, Youth Center</li>
                  <li>Gulshan-1, Dhaka 1212</li>
                  <li>Bangladesh</li>
                </>
              )}
              {orgData.contact_phone && (
                <li className="mt-2 text-slate-300 font-medium">{orgData.contact_phone}</li>
              )}
              {orgData.contact_email && (
                <li className="text-slate-300">{orgData.contact_email}</li>
              )}
            </ul>
          </div>
          
          <div>
            <h5 className="text-white font-bold uppercase tracking-widest mb-5">Legal</h5>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-primary transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition">Donation Policy</a></li>
              <li><a href="#" className="hover:text-primary transition">Annual Reports</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-900 pt-10 text-[10px] text-center">
          <p className="tracking-wide">© {new Date().getFullYear()} {orgData.org_full_name} ({orgData.org_name}). All Rights Reserved.</p>
          <p className="bn mt-3 opacity-40 text-xs">আমরা মানুষের সেবায় নিয়োজিত</p>
        </div>
      </div>
    </footer>
  )
}
