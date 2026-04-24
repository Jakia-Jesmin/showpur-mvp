import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-purple-100">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 border-b ${
        scrolled ? 'bg-white/80 backdrop-blur-md py-3 border-gray-100 shadow-sm' : 'bg-transparent py-6 border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏪</span>
            <span className="text-xl font-black tracking-tighter text-gray-900">ShowPur</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600">
            {['Features', 'Producers', 'Showrooms', 'Testimonials'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-purple-700 transition-colors">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-gray-700 hover:text-purple-700 px-4 py-2">Login</Link>
            <Link to="/register" className="bg-gray-900 text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-purple-700 transition-all shadow-lg shadow-gray-200">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-in fade-in slide-in-from-left-8 duration-1000">
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-gray-900">
              Connect Local Producers with 
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Retail Showrooms
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-500 leading-relaxed max-w-xl">
              ShowPur is the ultimate bridge for small-scale creators and retail stores. 
              Display your products, reach new customers, and grow together.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/register" className="bg-purple-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-purple-800 transition-all shadow-xl shadow-purple-100">
                Start Free Trial
              </Link>
              <button className="bg-white border border-gray-200 text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all">
                Watch Demo →
              </button>
            </div>
            
            <div className="mt-12 pt-12 border-t border-gray-100 flex gap-12">
              {[
                { label: 'Showrooms', val: '500+' },
                { label: 'Products', val: '2k+' },
                { label: 'Customers', val: '50k+' }
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-2xl font-black text-gray-900">{stat.val}</div>
                  <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000">
            <div className="relative z-10 bg-gradient-to-br from-purple-100 to-indigo-50 rounded-[3rem] p-4 shadow-2xl">
              <div className="bg-white rounded-[2rem] p-8 shadow-inner aspect-square flex flex-col justify-center gap-4">
                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <div className="text-2xl">📦</div>
                  <div className="font-bold text-purple-900">Handmade Crafts listed</div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 translate-x-8">
                  <div className="text-2xl">🥦</div>
                  <div className="font-bold text-indigo-900">Organic Foods verified</div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-pink-50 rounded-2xl border border-pink-100">
                  <div className="text-2xl">🎨</div>
                  <div className="font-bold text-pink-900">Local Art showcased</div>
                </div>
              </div>
            </div>
            {/* Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-200/30 blur-[100px] -z-10 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-black tracking-tight text-gray-900">Why Choose ShowPur?</h2>
            <p className="mt-4 text-lg text-gray-500">The complete solution for modern local commerce.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Smart Matching', desc: 'Algorithm-driven connections based on location and audience.', icon: '🤝' },
              { title: 'Real-Time Analytics', desc: 'Track sales, commissions, and performance in real-time.', icon: '📊' },
              { title: 'Fair Commission', desc: 'Set your own rates. Transparent pricing with no hidden fees.', icon: '💰' },
              { title: 'Inventory Tools', desc: 'Manage stock across multiple locations with ease.', icon: '🏪' },
              { title: 'Mobile Ready', desc: 'Fully responsive platform for management on the go.', icon: '📱' },
              { title: 'Secure Payments', desc: 'Protected transactions and secure payment processing.', icon: '🔒' }
            ].map((f, i) => (
              <div key={i} className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="text-4xl mb-6">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Ready to Grow Your Business?</h2>
          <p className="text-gray-400 text-lg mb-10">Join thousands of producers and showrooms already using ShowPur.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-purple-500 transition-all">
              Get Started Free
            </Link>
            <Link to="/contact" className="bg-white/10 text-white border border-white/20 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">
              Contact Sales
            </Link>
          </div>
        </div>
        {/* Background Mesh Gradient */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 blur-[120px] rounded-full" />
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-400">
          <div className="font-bold text-gray-900">© 2026 ShowPur. Bangladesh.</div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-purple-700">Privacy</a>
            <a href="#" className="hover:text-purple-700">Terms</a>
            <a href="#" className="hover:text-purple-700">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
