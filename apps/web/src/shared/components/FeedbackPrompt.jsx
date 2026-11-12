import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function FeedbackPrompt({ page = 'app' }) {
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

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!message.trim()) {
      setError('Please enter your feedback message or issue description.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Anonymous',
          message: message.trim(),
          rating: type === 'testimonial' ? rating : undefined,
          type,
          page: window.location.pathname || page,
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
        marginTop: '16px',
        padding: '16px',
        borderRadius: '8px',
        background: '#0C0B0A',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        position: 'relative',
        color: '#F0EDE8',
      }}
    >
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss feedback"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'none',
          border: 'none',
          color: '#6B7280',
          cursor: 'pointer',
          fontSize: '16px',
          lineHeight: '1',
          padding: '4px',
        }}
      >
        ×
      </button>

      {submitted ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0EDE8' }}>
            {type === 'testimonial' ? 'Thank you for your feedback' : 'Issue reported successfully'}
          </div>
          <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
            {type === 'testimonial'
              ? 'Approved testimonials are featured on the community wall.'
              : 'Our engineering team tracks all reported issues in the public backlog.'}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Header & Type Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '14px',
              paddingRight: '20px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#F0EDE8' }}>
              Share Feedback or Report an Issue
            </span>

            <div
              style={{
                display: 'inline-flex',
                background: '#141312',
                borderRadius: '6px',
                padding: '2px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                type="button"
                onClick={() => setType('testimonial')}
                style={{
                  background: type === 'testimonial' ? '#6366f1' : 'transparent',
                  color: type === 'testimonial' ? '#FFFFFF' : '#9CA3AF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Testimonial
              </button>
              <button
                type="button"
                onClick={() => setType('issue')}
                style={{
                  background: type === 'issue' ? '#6366f1' : 'transparent',
                  color: type === 'issue' ? '#FFFFFF' : '#9CA3AF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Report Issue
              </button>
            </div>
          </div>

          {/* Star rating for Testimonials */}
          {type === 'testimonial' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Rating:</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '0 2px',
                        color: active ? '#6366f1' : 'rgba(255, 255, 255, 0.2)',
                        lineHeight: 1,
                      }}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
              <span style={{ fontSize: '11px', color: '#6B7280' }}>
                ({rating}/5)
              </span>
            </div>
          )}

          {/* Name input */}
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Your name or handle (optional, defaults to Anonymous)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                fontSize: '12px',
                padding: '8px 12px',
                borderRadius: '6px',
                background: '#141312',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#F0EDE8',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Message input */}
          <div style={{ marginBottom: '10px' }}>
            <textarea
              rows={3}
              placeholder={
                type === 'testimonial'
                  ? 'What did you like about NextShare? Any specific feature that helped you?'
                  : 'Describe the bug, broken link, or issue you encountered (browser, steps to reproduce)...'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                fontSize: '12px',
                padding: '8px 12px',
                borderRadius: '6px',
                background: '#141312',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#F0EDE8',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                fontSize: '11px',
                color: '#EF4444',
                marginBottom: '10px',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: '6px',
                background: '#6366f1',
                color: '#FFFFFF',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                transition: 'opacity 0.15s ease',
              }}
            >
              {submitting ? 'Submitting...' : type === 'testimonial' ? 'Submit Testimonial' : 'Report Issue'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
