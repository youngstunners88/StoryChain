import React from 'react';
import { motion } from 'motion/react';

export function Publishers() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-1" style={{ color: '#ede6d6' }}>Publishers</h1>
        <p className="text-sm" style={{ color: '#8a7a68' }}>Bringing stories to the world</p>
      </div>

      {/* Coming soon card */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="rounded-3xl overflow-hidden"
        style={{ border: '1px solid #2a2218', background: '#0f0d0b' }}>

        {/* Gradient top bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #c9a84c, #34d399, #60a5fa)' }} />

        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.12), rgba(52,211,153,0.08))', border: '1px solid rgba(201,168,76,0.2)' }}>
            <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
          </div>

          <h2 className="font-serif text-2xl font-bold mb-3" style={{ color: '#ede6d6' }}>
            Coming Soon
          </h2>
          <p className="text-base mb-2 max-w-lg mx-auto leading-relaxed" style={{ color: '#8a7a68' }}>
            The Publishers hub will connect writers with traditional publishers, indie imprints, and
            self-publishing tools — turning polished manuscripts into published works.
          </p>
          <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: '#4a3f35' }}>
            Features will include deal-making pipelines, royalty split agreements, ISBN registry,
            cover design tools, and a full distribution and marketing kit.
          </p>

          {/* Feature preview pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {[
              { icon: '📝', label: 'Publishing Deals' },
              { icon: '💰', label: 'Royalty Splits' },
              { icon: '🌐', label: 'Distribution' },
              { icon: '🎨', label: 'Cover Design' },
              { icon: '📣', label: 'Marketing Kit' },
              { icon: '🔖', label: 'ISBN Registry' },
            ].map(({ icon, label }) => (
              <div key={label}
                className="px-4 py-2 rounded-full text-xs flex items-center gap-1.5"
                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.12)', color: '#6a5a40' }}>
                <span style={{ color: '#c9a84c' }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-3">
            <div className="h-px w-12" style={{ background: '#2a2218' }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: '#4a3f35' }}>
              Being Configured
            </span>
            <div className="h-px w-12" style={{ background: '#2a2218' }} />
          </div>
        </div>
      </motion.div>

      {/* Secondary info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {[
          {
            icon: '🏛️',
            title: 'Traditional Publishers',
            desc: 'Connect with established publishers actively acquiring completed works across all genres.',
          },
          {
            icon: '🖨️',
            title: 'Indie Publishers',
            desc: 'Self-publishing tools to produce, distribute, and sell your book on your own terms.',
          },
          {
            icon: '🔄',
            title: 'Publishing Pipeline',
            desc: 'End-to-end workflow from polished manuscript through editing, design, and distribution.',
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="rounded-2xl p-5"
            style={{ background: '#161210', border: '1px solid #2a2218' }}>
            <div className="text-2xl mb-3">{icon}</div>
            <h3 className="font-serif font-semibold text-sm mb-2" style={{ color: '#ede6d6' }}>{title}</h3>
            <p className="text-xs leading-relaxed" style={{ color: '#4a3f35' }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Publishers;
