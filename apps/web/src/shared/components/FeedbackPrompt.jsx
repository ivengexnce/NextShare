import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const TOOL_META = {
  url: { name: 'URL Shortener', icon: '🔗', tag: 'URL Shortener' },
  file: { name: 'File Sharing', icon: '📁', tag: 'File Share' },
  text: { name: 'Code Paste', icon: '📋', tag: 'Code Paste' },
};

const RATING_DESCRIPTIONS = {
  1: 'Disappointed 😕',
  2: 'Needs improvement 🛠️',
  3: 'Good 👍',
  4: 'Very good ✨',
  5: 'Loved it! 🚀',
};

const QUICK_CHIPS = [
  '⚡ Super Fast',
  '🔒 Clean & Private',
  '✨ Sleek UI',
  '🔥 No Accounts Needed',
];

export default function FeedbackPrompt({ tool = 'url', label = '', page = 'app' }) {
  const [type, setType] = useState('testimonial');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState('');

  if (dismissed) return null;

  const currentTool = TOOL_META[tool] || { name: 'NextShare', icon: '✨', tag: 'NextShare' };
  const displayRating = hoverRating || rating;

  function handleAddChip(chip) {
    if (!message.includes(chip)) {
      setMessage((prev) => (prev ? `${prev} · ${chip}` : chip));
    }
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!message.trim()) {
      setError(
        type === 'testimonial'
          ? 'Please tell us what you liked about NextShare.'
          : 'Please describe the bug or issue you encountered.'
      );
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Anonymous Developer',
          message: message.trim(),
          rating: type === 'testimonial' ? rating : undefined,
          type,
          page: tool || page,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Submission failed');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Could not send feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        marginTop: '20px',
        borderRadius: '12px',
        background: 'linear-gradient(180deg, #131211 0%, #0E0D0C 100%)',
        border: '1px solid rgba(255, 255, 255, 0.09)',
        boxShadow: '0 12px 36px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.03)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        position: 'relative',
        color: '#F0EDE8',
        padding: '20px 22px',
        animation: 'fpSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes fpSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fpPopIn {
          0% { transform: scale(0.85); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fpSpin {
          to { transform: rotate(360deg); }
        }
        .fp-input:focus {
          border-color: rgba(99, 102, 241, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
          background: #171615 !important;
        }
        .fp-chip:hover {
          background: rgba(99, 102, 241, 0.16) !important;
          border-color: rgba(99, 102, 241, 0.4) !important;
          color: #FFFFFF !important;
          transform: translateY(-1px);
        }
        .fp-chip:active {
          transform: translateY(0);
        }
        .fp-star-btn {
          transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.15s ease;
        }
        .fp-star-btn:hover {
          transform: scale(1.24);
        }
        .fp-submit-btn:hover:not(:disabled) {
          background: #4F46E5 !important;
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4) !important;
          transform: translateY(-1px);
        }
        .fp-submit-btn:active:not(:disabled) {
          transform: translateY(1px);
        }
        .fp-close-btn:hover {
          color: #FFFFFF !important;
          background: rgba(255, 255, 255, 0.08) !important;
          transform: rotate(90deg);
        }
      `}</style>

      {/* Dismiss button */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss feedback prompt"
        className="fp-close-btn"
        style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          background: 'transparent',
          border: 'none',
          color: '#6B7280',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: 1,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          padding: 0,
        }}
      >
        ×
      </button>

      {submitted ? (
        <div
          style={{
            textAlign: 'center',
            padding: '16px 0',
            animation: 'fpPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              color: '#34D399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              fontSize: '20px',
            }}
          >
            ✓
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#F0EDE8' }}>
            {type === 'testimonial' ? 'Thank you for your feedback!' : 'Issue logged to public backlog'}
          </div>
          <p
            style={{
              fontSize: '12.5px',
              color: '#9CA3AF',
              marginTop: '6px',
              marginBottom: '16px',
              lineHeight: 1.5,
              maxWidth: '440px',
              margin: '6px auto 16px auto',
            }}
          >
            {type === 'testimonial'
              ? 'Your review has been submitted for spotlight on our landing page community wall.'
              : 'Our engineering team actively tracks reports. You can monitor platform status on the landing page.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setMessage('');
              setName('');
            }}
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '6px 14px',
              borderRadius: '6px',
              background: '#1B1A19',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#9CA3AF',
              cursor: 'pointer',
            }}
          >
            Send another response
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Header Row: Title + Tool Tag + Type Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
              paddingRight: '32px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#F0EDE8', letterSpacing: '-0.01em' }}>
                Share Feedback or Report an Issue
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10.5px',
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#A5B4FC',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                }}
              >
                <span>{currentTool.icon}</span>
                <span>{currentTool.tag}</span>
              </span>
            </div>

            {/* Segmented Toggle */}
            <div
              style={{
                display: 'inline-flex',
                background: '#090807',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                gap: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setType('testimonial');
                  setError('');
                }}
                style={{
                  background: type === 'testimonial' ? '#6366f1' : 'transparent',
                  color: type === 'testimonial' ? '#FFFFFF' : '#9CA3AF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>★</span>
                <span>Testimonial</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('issue');
                  setError('');
                }}
                style={{
                  background: type === 'issue' ? '#6366f1' : 'transparent',
                  color: type === 'issue' ? '#FFFFFF' : '#9CA3AF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>⚡</span>
                <span>Report Issue</span>
              </button>
            </div>
          </div>

          {/* Rating Row (for Testimonials) */}
          {type === 'testimonial' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '14px',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', color: '#9CA3AF', fontWeight: 500 }}>Your Rating:</span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = displayRating >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="fp-star-btn"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '19px',
                          padding: '0 2px',
                          color: active ? '#F59E0B' : 'rgba(255, 255, 255, 0.15)',
                          lineHeight: 1,
                          filter: active ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.35))' : 'none',
                        }}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
              </div>

              <span
                style={{
                  fontSize: '11.5px',
                  color: '#FBBF24',
                  fontWeight: 500,
                  marginLeft: 'auto',
                }}
              >
                {RATING_DESCRIPTIONS[displayRating] || `${rating}/5`}
              </span>
            </div>
          )}

          {/* Optional Quick Tag Suggestions (for Testimonials) */}
          {type === 'testimonial' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={{ fontSize: '10.5px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quick Highlights:
              </span>
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleAddChip(chip)}
                  className="fp-chip"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Name input */}
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Your name or handle (optional, defaults to Anonymous Developer)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="fp-input"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                fontSize: '12px',
                padding: '9px 12px',
                borderRadius: '8px',
                background: '#121110',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#F0EDE8',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
            />
          </div>

          {/* Message input */}
          <div style={{ marginBottom: '12px' }}>
            <textarea
              rows={3}
              placeholder={
                type === 'testimonial'
                  ? `What did you like about NextShare ${currentTool.name}? Any specific feature or speed detail?`
                  : `Describe the issue, broken link, or bug you encountered on ${currentTool.name} (browser, steps)...`
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="fp-input"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                fontSize: '12px',
                lineHeight: 1.5,
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#121110',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#F0EDE8',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
                transition: 'all 0.15s ease',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                fontSize: '11.5px',
                color: '#F87171',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Submit button bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#6B7280' }}>
              {type === 'testimonial' ? '★ Appears on public community wall' : '⚡ Tracked in engineering backlog'}
            </span>

            <button
              type="submit"
              disabled={submitting}
              className="fp-submit-btn"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                padding: '7px 16px',
                borderRadius: '8px',
                background: '#6366f1',
                color: '#FFFFFF',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.75 : 1,
                transition: 'all 0.18s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {submitting ? (
                <>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#FFFFFF',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'fpSpin 0.7s linear infinite',
                    }}
                  />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>{type === 'testimonial' ? 'Submit Testimonial' : 'Report Issue'}</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
