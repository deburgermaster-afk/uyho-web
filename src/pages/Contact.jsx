import { useState } from 'react'
import { useOrg } from '../context/OrgContext'

export default function Contact() {
  const { orgData } = useOrg()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
    alert('Thank you for contacting us! We will get back to you soon.')
  }

  return (
    <main className="max-w-md mx-auto w-full pb-8">
      {/* Emergency Section */}
      <div className="px-4 pt-6">
        <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-extrabold leading-tight">
          Need Urgent Help?
        </h1>
        <p className="text-primary font-semibold text-lg bn">জরুরি সহায়তা প্রয়োজন?</p>
      </div>

      {/* Emergency Card */}
      <div className="p-4">
        <div className="flex flex-col items-stretch justify-start rounded-xl shadow-lg bg-white dark:bg-gray-800 border-l-4 border-primary overflow-hidden">
          <div className="flex w-full grow flex-col items-stretch justify-center gap-1 py-5 px-5">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">emergency</span>
              <span>Crisis Hotline</span>
            </div>
            <p className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] mt-1">
              Emergency Crisis Relief | <span className="bn">জরুরি ত্রাণ সহায়তা</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-relaxed mt-2">
              Call our 24/7 emergency hotline for immediate assistance in Bangladesh.
            </p>
            <div className="mt-4">
              <a 
                href={`tel:${orgData.contact_phone || '+8801234567890'}`}
                className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 bg-primary text-white text-base font-bold leading-normal transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined mr-2">call</span>
                <span className="truncate text-lg">Call Now | <span className="bn">এখনই কল করুন</span></span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className="px-4 pt-6">
        <h2 className="text-slate-900 dark:text-white text-2xl font-bold mb-4">
          Send us a Message | <span className="bn">বার্তা পাঠান</span>
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              Name | <span className="bn">নাম</span>
            </label>
            <input 
              type="text" 
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-primary focus:ring-primary" 
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              Email | <span className="bn">ইমেইল</span>
            </label>
            <input 
              type="email" 
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-primary focus:ring-primary" 
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              Subject | <span className="bn">বিষয়</span>
            </label>
            <select 
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-primary focus:ring-primary"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              required
            >
              <option value="">Select a subject</option>
              <option value="volunteer">Volunteer Inquiry</option>
              <option value="donation">Donation Question</option>
              <option value="partnership">Partnership Opportunity</option>
              <option value="general">General Inquiry</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              Message | <span className="bn">বার্তা</span>
            </label>
            <textarea 
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-primary focus:ring-primary" 
              placeholder="How can we help you?" 
              rows="4"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              required
            ></textarea>
          </div>
          <button 
            className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-colors" 
            type="submit"
          >
            Send Request | <span className="bn">অনুরোধ পাঠান</span>
          </button>
        </form>
      </div>

      {/* Visit Office Section */}
      <div className="px-4 py-8">
        <div className="bg-primary/10 dark:bg-primary/5 rounded-2xl p-6 border border-primary/20">
          <h3 className="text-slate-900 dark:text-white text-[20px] font-bold mb-4 flex items-center">
            <span className="material-symbols-outlined mr-2">location_on</span>
            Visit Our Office | <span className="bn">অফিসে আসুন</span>
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase font-bold text-primary tracking-widest">Headquarters</p>
              <p className="text-slate-900 dark:text-gray-200 font-medium leading-tight mt-1">
                {orgData.contact_address ? (
                  orgData.contact_address.split('\n').map((line, i) => (
                    <span key={i}>{line}{i < orgData.contact_address.split('\n').length - 1 && <br/>}</span>
                  ))
                ) : (
                  <>Level 4, Youth Center Building,<br/>Gulshan-1, Dhaka 1212, Bangladesh</>
                )}
              </p>
            </div>
            {orgData.contact_email && (
              <div>
                <p className="text-xs uppercase font-bold text-primary tracking-widest">Email</p>
                <a href={`mailto:${orgData.contact_email}`} className="text-slate-900 dark:text-gray-200 font-medium">
                  {orgData.contact_email}
                </a>
              </div>
            )}
            {orgData.contact_phone && (
              <div>
                <p className="text-xs uppercase font-bold text-primary tracking-widest">Phone</p>
                <a href={`tel:${orgData.contact_phone}`} className="text-slate-900 dark:text-gray-200 font-medium">
                  {orgData.contact_phone}
                </a>
              </div>
            )}
            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
              <p className="text-xs uppercase font-bold text-gray-500 mb-2 bn">সময়সূচী | Office Hours</p>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Sunday - Thursday</span>
                <span className="text-primary font-bold">9:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="font-medium">Friday - Saturday</span>
                <span className="text-gray-500">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
