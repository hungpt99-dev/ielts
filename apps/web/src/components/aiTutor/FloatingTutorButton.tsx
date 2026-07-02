import { useState } from 'react'

export default function FloatingTutorButton() {
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <style>{`
        @keyframes tutor-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes tutor-pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
          70% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>
      <div style={wrapperStyle}>
        {hovered && (
          <div style={tooltipStyle}>
            AI Tutor Assistant
            <span style={tooltipSubStyle}>Ask, learn, practice — your IELTS coach</span>
          </div>
        )}
        <button
          onClick={() => {
            const event = new CustomEvent('toggle-ai-tutor-chat')
            window.dispatchEvent(event)
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            ...buttonStyle,
            animation: hovered ? 'tutor-bounce 1s ease-in-out infinite' : 'tutor-pulse 2s ease-in-out infinite',
          }}
          aria-label="Open AI Tutor Assistant"
          title="AI Tutor Assistant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </>
  )
}

const wrapperStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '8px',
}

const buttonStyle: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  border: 'none',
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
  transition: 'all 0.2s ease',
}

const tooltipStyle: React.CSSProperties = {
  background: '#1e293b',
  color: '#fff',
  padding: '8px 14px',
  borderRadius: '10px',
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: '1.4',
  textAlign: 'right',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  maxWidth: '180px',
}

const tooltipSubStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 400,
  opacity: 0.7,
  marginTop: '2px',
}
