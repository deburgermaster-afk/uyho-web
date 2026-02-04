import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VolunteerFooter from '../../components/VolunteerFooter';

export default function SelectParentWingPage() {
  const navigate = useNavigate();
  const [wings, setWings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentParentId, setCurrentParentId] = useState(null);
  
  const volunteerId = localStorage.getItem('volunteerId');

  useEffect(() => {
    fetchWings();
  }, []);

  const fetchWings = async () => {
    try {
      const res = await fetch(`/api/volunteers/${volunteerId}/wings`);
      if (res.ok) {
        const data = await res.json();
        setWings(data);
        // Find current parent wing
        const parentWing = data.find(w => w.is_parent === 1) || data[0];
        if (parentWing) {
          setCurrentParentId(parentWing.wing_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch wings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectParent = async (wingId) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/volunteers/${volunteerId}/parent-wing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wingId })
      });
      
      if (res.ok) {
        setCurrentParentId(wingId);
        navigate('/volunteer/profile');
      } else {
        alert('Failed to update parent wing');
      }
    } catch (err) {
      console.error('Failed to set parent wing:', err);
      alert('Failed to update parent wing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <span className="material-symbols-outlined animate-spin text-4xl text-[#0B1B33]">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <main className="max-w-md mx-auto pb-32">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#F5F7FB] px-4 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-[#0B1B33]">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold text-[#0B1B33]">Select Parent Wing</h1>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-4">
          <p className="text-sm text-slate-600">
            Your parent wing will be displayed on your profile and in search results. 
            Select from the wings you've joined below.
          </p>
        </div>

        {/* Wings List */}
        <div className="px-6">
          {wings.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">location_city</span>
              <p className="text-sm text-slate-500">You haven't joined any wings yet</p>
              <button
                onClick={() => navigate('/volunteer/wings')}
                className="mt-4 px-6 py-2 bg-[#0B1B33] text-white rounded-lg text-sm font-medium"
              >
                Browse Wings
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {wings.map((wing) => (
                <button
                  key={wing.wing_id}
                  onClick={() => handleSelectParent(wing.wing_id)}
                  disabled={saving}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    currentParentId === wing.wing_id
                      ? 'border-[#0B1B33] bg-[#0B1B33]/5'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-[#0B1B33]">{wing.wing_name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {wing.role} • {wing.location || 'No location'}
                      </p>
                    </div>
                    {currentParentId === wing.wing_id && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                        <span className="text-[10px] font-bold uppercase">Current</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      <VolunteerFooter />
    </div>
  );
}
