import { createContext, useContext, useState, useEffect } from 'react';

const OrgContext = createContext(null);

export function OrgProvider({ children }) {
  const [orgData, setOrgData] = useState({
    org_name: 'UYHO',
    org_full_name: 'United Young Help Organization',
    org_description: '',
    org_logo: '/logo.png',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    website_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    linkedin_url: '',
    youtube_url: '',
    tiktok_url: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    try {
      const res = await fetch('/api/organization');
      if (res.ok) {
        const data = await res.json();
        setOrgData(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching org data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshOrgData = () => {
    fetchOrgData();
  };

  return (
    <OrgContext.Provider value={{ orgData, loading, refreshOrgData }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}

export default OrgContext;
