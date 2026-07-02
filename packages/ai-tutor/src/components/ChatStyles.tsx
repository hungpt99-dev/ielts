const keyframes = `
@keyframes tutor-avatar-pulse {
  0%, 100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.12); opacity: 0.15; }
}
@keyframes typing-bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}
@keyframes chat-popup-in {
  from { opacity: 0; transform: translateY(16px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes chat-popup-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(16px) scale(0.96); }
}
@keyframes chat-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes chat-message-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: chat-fade-in 0.3s ease-out; }
.chat-message-in { animation: chat-message-in 0.25s ease-out; }
`

export function ChatStyles() {
  return <style>{keyframes}</style>
}
