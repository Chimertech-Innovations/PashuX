import React, { useState } from 'react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    category: 'general',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate instant form submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 sm:pt-32 lg:pt-36 pb-20 px-4 sm:px-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-8 text-left">
        {/* Header Title */}
        <div className="space-y-3 border-b border-slate-200 pb-6 animate-fade-up">
          <div className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="section-label text-emerald-700 font-extrabold tracking-widest uppercase text-[11px]">Get In Touch</p>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Contact Us
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-2xl leading-relaxed">
            Have questions about PashuX Cattle AI Screening, iHerd mobile app, or Chimertech veterinary products? Connect directly with our team.
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact Cards & Info */}
          <div className="lg:col-span-5 space-y-4">
            {/* Email Support */}
            <div className="glass-card p-6 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-2 hover:border-emerald-300 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                  ✉️
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Email Support</h3>
                  <p className="text-xs text-slate-500 font-medium">Response within 24 hours</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <a href="mailto:support@chimertech.shop" className="text-xs font-bold text-slate-900 hover:text-emerald-700 block">
                  support@chimertech.shop
                </a>
                <a href="mailto:contact@chimertech.com" className="text-xs font-bold text-slate-700 hover:text-emerald-700 block">
                  contact@chimertech.com
                </a>
              </div>
            </div>

            {/* Helpline / Phone */}
            <div className="glass-card p-6 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-2 hover:border-emerald-300 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                  📞
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Helpline & WhatsApp</h3>
                  <p className="text-xs text-slate-500 font-medium">Mon - Sat: 9:00 AM – 6:00 PM IST</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <a href="tel:+919443054321" className="text-xs font-bold text-slate-900 hover:text-emerald-700 block">
                  +91 94430 54321 (Customer Care)
                </a>
                <a href="https://wa.me/919443054321" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-700 hover:underline block">
                  💬 Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Office Location */}
            <div className="glass-card p-6 bg-white border border-slate-200/90 rounded-2xl shadow-sm space-y-2 hover:border-emerald-300 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
                  🏢
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Corporate Headquarters</h3>
                  <p className="text-xs text-slate-500 font-medium">Chimertech Private Limited</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-700 space-y-1 font-medium leading-relaxed">
                <p className="font-bold text-slate-900">Chimertech Private Limited</p>
                <p>Technology Business Incubator / Livestock Innovation Centre</p>
                <p>Salem & Bengaluru Operations, India</p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="glass-card p-6 sm:p-8 bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/40">
              <h2 className="text-xl font-extrabold text-slate-900 mb-1">Send Us a Message</h2>
              <p className="text-xs text-slate-500 mb-6 font-semibold">Fill in the form below and our team will get back to you promptly.</p>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-slate-900 space-y-3 animate-fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl">
                    ✓
                  </div>
                  <h3 className="text-base font-black text-emerald-950">Thank You for Reaching Out!</h3>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    Your message has been successfully received by Chimertech support. We will review your inquiry and reply within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', subject: '', category: 'general', message: '' });
                    }}
                    className="btn-secondary text-xs py-2 px-4 font-bold text-slate-900 mt-2"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Ramesh Kumar"
                        className="input-field text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@example.com"
                        className="input-field text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Phone / Mobile Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="input-field text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Inquiry Category</label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="input-field text-xs font-semibold text-slate-800"
                      >
                        <option value="general">General Support</option>
                        <option value="bcs_screening">PashuX AI Screening</option>
                        <option value="iherd_app">iHerd Mobile App</option>
                        <option value="products">Veterinary Products & Orders</option>
                        <option value="partnership">Veterinary / Enterprise Partnership</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Subject *</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Brief summary of your inquiry"
                      className="input-field text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Detailed Message *</label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please describe how we can assist you..."
                      className="input-field text-xs resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 text-xs font-black shadow-md shadow-emerald-500/20"
                  >
                    {loading ? 'Submitting Message...' : 'Send Message →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
