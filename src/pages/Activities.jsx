import { useEffect } from 'react'

export default function Activities() {
  useEffect(() => {
    // Load Facebook SDK and render posts
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
    <main className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">Recent Activities</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Follow our latest updates and initiatives on Facebook. Stay connected with UYHO's mission to serve humanity.
        </p>
      </div>

      {/* Facebook Feed */}
      <div className="px-6 pb-16 max-w-2xl mx-auto space-y-8">
        
        {/* Post 1 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="fb-post" data-href="https://www.facebook.com/uyho.org/posts/pfbid02i2xHVZT11kmE4K8qXeZ2Tb4bxx7SASFqdQxUiYNwLuzSYJoffSeeyQ3h17u2VEABl" data-show-text="true" data-width="500"></div>
        </div>

        {/* Post 2 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="fb-post" data-href="https://www.facebook.com/uyho.org/posts/pfbid0i773WV2biwu1CbRVL7BkzJsj4oqqfiNRVNDvY48s1W3kbBGbuV5cm87bbfDxWcy4l" data-show-text="true" data-width="500"></div>
        </div>

        {/* Post 3 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="fb-post" data-href="https://www.facebook.com/uyho.org/posts/pfbid02V1DiV6gahQm5fC59MqFMw9vwumtnXwkySfQKEEDvMPb9MXoQsKCEA3osNxhfl" data-show-text="true" data-width="500"></div>
        </div>

        {/* Post 4 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="fb-post" data-href="https://www.facebook.com/uyho.org/posts/pfbid02FC48EKwvBJsMhWvsxexvzxKWo6JYqzhR71sK47onG3XpUgFkzagyQi8sWX3woesil" data-show-text="true" data-width="500"></div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl p-8 text-center border border-primary/20">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Follow Us on Facebook</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Stay updated with our latest initiatives and impact stories
          </p>
          <a 
            href="https://www.facebook.com/uyho.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">public</span>
            Visit Our Facebook Page
          </a>
        </div>
      </div>
    </main>
  )
}
