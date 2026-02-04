import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    // Load Facebook SDK only when needed for the Recent Activities section
    if (window.loadFacebookSDK) {
      window.loadFacebookSDK()
    }
    // Parse FB posts when SDK is ready
    const checkAndParse = () => {
      if (window.FB) {
        window.FB.XFBML.parse()
      } else {
        setTimeout(checkAndParse, 500)
      }
    }
    checkAndParse()
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex flex-col">
          <div className="h-[340px] relative">
            <img 
              alt="Empowering children in Bangladesh" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&h=400&fit=crop"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute bottom-8 left-6 right-6">
              <span className="bg-teal-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
                Impact Lives
              </span>
              <h1 className="text-white text-3xl font-extrabold leading-tight mb-6">
                Small Acts, Big Impact.<br/>
                <span className="bn text-2xl font-semibold">আপনার সামান্য সাহায্য কারো জীবন বদলাতে পারে।</span>
              </h1>
              <div className="flex gap-4">
                <button onClick={() => navigate('/join')} className="flex-1 bg-white text-slate-900 font-bold py-3.5 rounded-lg text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-transform">
                  Join Now
                </button>
                <button onClick={() => navigate('/donate')} className="flex-1 bg-transparent border-2 border-white text-white font-bold py-3.5 rounded-lg text-sm uppercase tracking-wider active:scale-95 transition-transform">
                  Donate
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-900">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              We are a youth-led volunteer organization working to bring positive change in Bangladesh through education, healthcare, and emergency relief programs. Join us in our mission to serve humanity.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-extrabold text-primary mb-1">50k+</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Lives Impacted</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-primary mb-1">200+</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Volunteers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-primary mb-1">5+ Yrs</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Service</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Volunteer Portal CTA */}
      <section className="py-8 px-6 bg-gradient-to-r from-primary/10 to-primary/5 border-y border-primary/20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Already a Volunteer?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Access your dashboard and explore campaigns, programs, and leaderboards.</p>
            </div>
            <button 
              onClick={() => navigate('/volunteer')}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-bold whitespace-nowrap transition-colors ml-4"
            >
              Go to Portal
            </button>
          </div>
        </div>
      </section>

      {/* Our Focus Areas */}
      <section className="py-12 px-6 bg-slate-50 dark:bg-slate-800/30">
        <h2 className="text-2xl font-black mb-8 dark:text-white">Our Focus Areas</h2>
        <div className="grid gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">school</span>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Education for All</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Providing educational support to underprivileged children across rural Bangladesh. We run free tutoring programs and distribute school supplies.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">health_and_safety</span>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Healthcare Services</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Operating medical camps and clinics in remote areas. Providing free health checkups and essential medicines to communities in need.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary">emergency</span>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Emergency Relief</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Rapid response team for natural disasters. We provide food, shelter, and essential supplies during floods, cyclones, and other emergencies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stories of Change */}
      <section className="py-12 px-6 bg-white dark:bg-slate-900">
        <h2 className="text-2xl font-black mb-8 dark:text-white">Stories of Change</h2>
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 no-scrollbar">
          <div className="min-w-[280px] bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-800">
            <img 
              alt="Education" 
              className="w-full h-44 object-cover grayscale" 
              src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop"
            />
            <div className="p-5">
              <h4 className="font-bold text-sm mb-2">Back to School: Rahim's Journey</h4>
              <p className="text-xs text-slate-500 mb-5 line-clamp-2">
                How a small donation helped Rahim return to primary school after 2 years.
              </p>
              <a className="text-xs font-bold text-teal-600 flex items-center gap-1 uppercase tracking-wider" href="#">
                Read More <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </a>
            </div>
          </div>

          <div className="min-w-[280px] bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-800">
            <img 
              alt="Health" 
              className="w-full h-44 object-cover grayscale" 
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop"
            />
            <div className="p-5">
              <h4 className="font-bold text-sm mb-2">Clean Water for Barishal Village</h4>
              <p className="text-xs text-slate-500 mb-5 line-clamp-2">
                Installation of 5 deep tube wells providing safe drinking water to 200 families.
              </p>
              <a className="text-xs font-bold text-teal-600 flex items-center gap-1 uppercase tracking-wider" href="#">
                Read More <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activities */}
      <section className="py-12 px-6 bg-slate-50 dark:bg-slate-800/30">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black dark:text-white">Recent Activities</h2>
          <button onClick={() => navigate('/activities')} className="text-sm font-bold text-primary hover:text-primary/80">
            View All →
          </button>
        </div>
        <div className="space-y-8 max-w-2xl">
          {/* Facebook Post 1 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm fb-post">
            <div className="fb-post" data-href="https://www.facebook.com/uyho.org/posts/pfbid02i2xHVZT11kmE4K8qXeZ2Tb4bxx7SASFqdQxUiYNwLuzSYJoffSeeyQ3h17u2VEABl" data-show-text="true" data-width="500"></div>
          </div>

          {/* Facebook Post 3 */}
          <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm fb-post">
            <div className="fb-post" data-href="https://www.facebook.com/uyho.org/posts/pfbid02V1DiV6gahQm5fC59MqFMw9vwumtnXwkySfQKEEDvMPb9MXoQsKCEA3osNxhfl" data-show-text="true" data-width="500"></div>
          </div>
        </div>
      </section>
    </div>
  )
}
