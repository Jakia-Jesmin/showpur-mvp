// frontend/src/pages/LandingPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-purple-100 overflow-hidden">
      
      {/* ============================================ */}
      {/* TOP BAR - Trust Signals */}
      {/* ============================================ */}
      <div className="bg-gray-900 text-white text-sm py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span>🇧🇩 Made for Bangladeshi SMEs</span>
            <span className="text-gray-500">|</span>
            <span>📞 +880 1869-006016</span>
          </div>
          <div className="flex items-center gap-4">
            <span>⭐ Trusted by 500+ Businesses</span>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* NAVIGATION */}
      {/* ============================================ */}
      <nav
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md py-3 border-b border-gray-100 shadow-sm'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg group-hover:scale-105 transition-transform">
              🏪
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">ShowPur</h1>
              <p className="text-[10px] text-gray-400 font-medium leading-tight">
                Commerce + Finance
              </p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-gray-600">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'FAQ', href: '#faq' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="hover:text-purple-700 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-gray-700 hover:text-purple-700 px-4 py-2 hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-purple-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 active:scale-95"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>
      </nav>

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="relative pt-28 pb-20 md:pt-44 md:pb-28 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-[-5%] w-[45%] h-[45%] bg-purple-200/30 blur-[130px] rounded-full" />
          <div className="absolute bottom-10 right-[-5%] w-[40%] h-[40%] bg-indigo-200/30 blur-[130px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          
          {/* Left Content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 px-4 py-2 text-sm mb-6 bg-purple-50 text-purple-700 font-semibold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Free 14-Day Trial — No Credit Card
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-gray-900">
              Run Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Entire Business
              </span>
              From One Place
            </h1>

            <p className="mt-6 text-lg md:text-xl text-gray-500 leading-relaxed max-w-xl">
              ShowPur connects your products with buyers while 
              <span className="text-purple-600 font-semibold"> AcShow</span> handles 
              cashflow, inventory, and dues — so you never lose track of money.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="bg-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 text-center active:scale-95"
              >
                🚀 Start Free Trial — 14 Days
              </Link>
              <a
                href="#how-it-works"
                className="bg-white border-2 border-gray-200 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-center"
              >
                ▶ See How It Works
              </a>
            </div>

            {/* Trust Pills */}
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">🔒 SSL Secured</span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1">⏱ Setup in 2 Minutes</span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1">📱 Mobile Friendly</span>
            </div>

            {/* Social Proof */}
            <div className="mt-12 pt-10 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Trusted by SMEs across Bangladesh
              </p>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'Active Businesses', val: '500+' },
                  { label: 'Products Listed', val: '2,000+' },
                  { label: 'Transactions Tracked', val: '৳5Cr+' },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-2xl md:text-3xl font-black text-gray-900">
                      {stat.val}
                    </div>
                    <div className="text-xs md:text-sm text-gray-400 font-medium mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Visual Card */}
          <div className="relative hidden lg:block">
            <div className="relative z-10 bg-gradient-to-br from-purple-100 via-indigo-50 to-pink-50 rounded-[2.5rem] p-5 shadow-2xl border border-white/60">
              <div className="bg-white rounded-[2rem] p-6 shadow-inner space-y-4">
                
                {/* Cash Card */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
                  <p className="text-xs text-gray-500 font-medium">Today's Cash Position</p>
                  <h3 className="text-3xl font-black text-gray-900 mt-1">৳ 48,500</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 rounded-full bg-green-200 text-green-800 text-xs font-bold">+18%</span>
                    <span className="text-xs text-gray-400">vs yesterday</span>
                  </div>
                </div>

                {/* Alerts */}
                <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="font-bold text-orange-800 text-sm">2 Payments Due This Week</p>
                    <p className="text-xs text-orange-600">৳ 25,000 total — View details →</p>
                  </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <p className="text-xs text-gray-500">To Collect</p>
                    <p className="text-xl font-black text-blue-700">৳ 32,000</p>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <p className="text-xs text-gray-500">Stock Items</p>
                    <p className="text-xl font-black text-purple-700">156</p>
                  </div>
                </div>

                {/* AcShow Badge */}
                <div className="bg-gray-900 text-white rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="font-bold text-sm">AcShow Finance Module</p>
                    <p className="text-xs text-gray-400">Cashflow • Dues • Inventory</p>
                  </div>
                  <span className="ml-auto text-xs bg-purple-600 px-2 py-1 rounded-full">ACTIVE</span>
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-purple-200/20 blur-[120px] -z-10 rounded-full" />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PROBLEM / SOLUTION STRIP */}
      {/* ============================================ */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-bold text-red-500 uppercase tracking-wider mb-4">
            The Problem
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-6">
            "I don't know how much cash I have right now."
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto mb-8">
            Most SMEs use notebooks or Excel. They lose track of dues, miss payments, 
            and don't know their real profit. ShowPur + AcShow fixes this.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['❌ No cash visibility', '❌ Forgotten dues', '❌ Stock confusion', '❌ Manual errors'].map((problem, i) => (
              <span key={i} className="bg-red-50 text-red-700 text-sm font-medium px-4 py-2 rounded-full border border-red-100">
                {problem}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES GRID */}
      {/* ============================================ */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-sm font-bold text-purple-600 uppercase tracking-wider">
              Everything You Need
            </p>
            <h2 className="mt-4 text-4xl md:text-5xl font-black tracking-tight text-gray-900">
              Two Powerful Modules, One Platform
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* ShowPur Card */}
            <div className="bg-white rounded-3xl border-2 border-purple-100 p-8 hover:border-purple-300 hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="text-2xl font-black text-purple-700 mb-2">ShowPur</h3>
              <p className="text-sm text-purple-500 font-semibold mb-4">Commerce Platform</p>
              <ul className="space-y-3">
                {[
                  'Showcase products to buyers',
                  'Connect with retailers & distributors',
                  'Manage product catalog',
                  'Receive orders online',
                  'Build business network',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <span className="text-purple-500">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* AcShow Card */}
            <div className="bg-white rounded-3xl border-2 border-indigo-100 p-8 hover:border-indigo-300 hover:shadow-xl transition-all">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-2xl font-black text-indigo-700 mb-2">AcShow</h3>
              <p className="text-sm text-indigo-500 font-semibold mb-4">Finance Module</p>
              <ul className="space-y-3">
                {[
                  'Track daily cash position',
                  'Manage receivables & payables',
                  'Monitor inventory levels',
                  'Get business health score',
                  '7-day cashflow forecast',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700">
                    <span className="text-indigo-500">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS */}
      {/* ============================================ */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-purple-600 uppercase tracking-wider">How It Works</p>
            <h2 className="mt-4 text-4xl md:text-5xl font-black text-gray-900">
              Start in 3 Simple Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                title: 'Create Free Account',
                desc: 'Sign up in 2 minutes. No credit card needed. Start your 14-day free trial.',
                icon: '📝',
              },
              {
                step: '2',
                title: 'Add Your Products',
                desc: 'List your products, set prices, and connect with showrooms and buyers.',
                icon: '📦',
              },
              {
                step: '3',
                title: 'Track Your Business',
                desc: 'Monitor sales, cashflow, and inventory from one simple dashboard.',
                icon: '📊',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-sm font-black text-purple-600 mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PRICING */}
      {/* ============================================ */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-purple-600 uppercase tracking-wider">Pricing</p>
            <h2 className="mt-4 text-4xl md:text-5xl font-black text-gray-900">
              Start Free, Upgrade When Ready
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Trial */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 text-center hover:border-purple-200 transition-all">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-2xl font-black text-gray-900">Free Trial</h3>
              <p className="text-gray-500 mt-2">14 days, no credit card</p>
              <div className="text-5xl font-black text-gray-900 mt-6">৳0</div>
              <p className="text-sm text-gray-400 mt-1">for 14 days</p>
              <ul className="mt-6 space-y-2 text-left text-sm text-gray-700">
                {['All ShowPur features', 'All AcShow features', 'Unlimited products', 'Mobile access'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">✓ {f}</li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block mt-8 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-all"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-purple-600 rounded-3xl p-8 text-center text-white relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-black px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-2xl font-black">ShowPur Pro</h3>
              <p className="text-purple-200 mt-2">Full platform access</p>
              <div className="text-5xl font-black mt-6">৳999<span className="text-lg font-normal text-purple-200">/mo</span></div>
              <p className="text-sm text-purple-200 mt-1">or ৳9,999/year (save 17%)</p>
              <ul className="mt-6 space-y-2 text-left text-sm">
                {['Everything in Free', 'Priority support', 'Advanced reports', 'Unlimited transactions', 'Data export'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2">✓ {f}</li>
                ))}
              </ul>
              <Link
                to="/register"
                className="block mt-8 bg-white text-purple-700 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIAL */}
      {/* ============================================ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-5xl mb-6">💬</p>
          <blockquote className="text-xl md:text-2xl font-semibold text-gray-700 italic leading-relaxed">
            "Before ShowPur, I tracked everything in a notebook. Now I know exactly 
            who owes me money and how much cash I have. It's like having an accountant 
            in my pocket."
          </blockquote>
          <div className="mt-6">
            <p className="font-black text-gray-900">— Rahim Uddin</p>
            <p className="text-sm text-gray-500">Hardware Store Owner, Dhaka</p>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ */}
      {/* ============================================ */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              { q: 'Do I need accounting knowledge?', a: 'No! AcShow is designed for non-accountants. We use simple language like "Money In" and "Money Out" instead of debit/credit.' },
              { q: 'Is my data safe?', a: 'Yes. We use bank-level encryption. Your data is backed up daily and never shared with third parties.' },
              { q: 'Can I use it on my phone?', a: 'Absolutely! ShowPur and AcShow work perfectly on mobile browsers. No app download needed.' },
              { q: 'What if I have multiple shops?', a: 'You can manage multiple businesses from one account. Switch between them easily.' },
            ].map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {faq.q}
                  <span className="text-xl">{activeFaq === i ? '−' : '+'}</span>
                </button>
                {activeFaq === i && (
                  <div className="px-5 pb-5 text-gray-500">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA */}
      {/* ============================================ */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600 blur-[130px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 blur-[130px] rounded-full" />
        </div>

        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Ready to Take Control of Your Business?
          </h2>
          <p className="mt-6 text-lg text-gray-400 max-w-xl mx-auto">
            Join 500+ SMEs already using ShowPur + AcShow. Free 14-day trial, no credit card required.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-purple-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-purple-500 transition-all shadow-xl shadow-purple-900/50 active:scale-95"
            >
              🚀 Start Free Trial Now
            </Link>
            <Link
              to="/login"
              className="bg-white/10 text-white border border-white/20 px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
            >
              Sign In
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            ⏱ 2-minute setup • 📱 Works on mobile • 🔒 No credit card
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-black text-lg text-gray-900">ShowPur</h4>
              <p className="text-sm text-gray-500 mt-2">Commerce + Cashflow Platform for SMEs</p>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 mb-3">Product</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#features" className="block hover:text-purple-600">Features</a>
                <a href="#pricing" className="block hover:text-purple-600">Pricing</a>
                <a href="#faq" className="block hover:text-purple-600">FAQ</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 mb-3">Company</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#" className="block hover:text-purple-600">About</a>
                <a href="#" className="block hover:text-purple-600">Contact</a>
                <a href="#" className="block hover:text-purple-600">Blog</a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 mb-3">Legal</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <a href="#" className="block hover:text-purple-600">Privacy Policy</a>
                <a href="#" className="block hover:text-purple-600">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} ShowPur. All rights reserved. Made for Bangladeshi SMEs 🇧🇩
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
