import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// ─── Sugerencias rápidas de preguntas frecuentes ────────────────────────────
const QUICK_SUGGESTIONS = [
    '¿Cómo registro un equipo?',
    '¿Cómo recupero mi contraseña?',
    '¿Cómo descargo mi carnet QR?',
    '¿Qué roles existen en el sistema?',
];

const ChatbotWidget = () => {
    const [isOpen, setIsOpen]       = useState(false);
    const [messages, setMessages]   = useState([
        {
            role: 'model',
            text: '¡Hola! 👋 Soy el asistente virtual de **SenaAccess**. ¿En qué puedo ayudarte hoy?',
        },
    ]);
    const [input, setInput]         = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const messagesEndRef            = useRef(null);
    const inputRef                  = useRef(null);

    // Auto-scroll al último mensaje
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Focus al input cuando se abre el chat
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    const sendMessage = async (text) => {
        const userText = (text || input).trim();
        if (!userText || isLoading) return;

        setInput('');
        setShowSuggestions(false);

        // Agrega mensaje del usuario
        const updatedMessages = [...messages, { role: 'user', text: userText }];
        setMessages(updatedMessages);
        setIsLoading(true);

        // Historial para enviar al backend (excluye el mensaje del sistema inicial)
        const history = updatedMessages.slice(1, -1).map((m) => ({
            role: m.role,
            text: m.text,
        }));

        try {
            const token = localStorage.getItem('access_token');
            const { data } = await axios.post(
                '/api/chatbot',
                { message: userText, history },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessages((prev) => [
                ...prev,
                { role: 'model', text: data.reply },
            ]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'model',
                    text: '❌ Hubo un error al contactar el asistente. Verifica tu conexión e intenta de nuevo.',
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([
            {
                role: 'model',
                text: '¡Hola! 👋 Soy el asistente virtual de **SenaAccess**. ¿En qué puedo ayudarte hoy?',
            },
        ]);
        setShowSuggestions(true);
    };

    // Renderiza texto con soporte básico de Markdown (negrita)
    const renderText = (text) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
                ? <strong key={i}>{part.slice(2, -2)}</strong>
                : part
        );
    };

    return (
        <>
            {/* ── Burbuja flotante ──────────────────────────────────────── */}
            <button
                id="chatbot-bubble"
                onClick={() => setIsOpen((o) => !o)}
                title="Asistente SenaAccess"
                style={{
                    position: 'fixed',
                    bottom: '28px',
                    right: '28px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #39a900 0%, #2d8a00 100%)',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(57,169,0,0.45)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 28px rgba(57,169,0,0.6)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(57,169,0,0.45)';
                }}
            >
                <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '28px' }}>
                    {isOpen ? 'close' : 'smart_toy'}
                </span>
            </button>

            {/* ── Ventana del chat ─────────────────────────────────────── */}
            {isOpen && (
                <div
                    id="chatbot-window"
                    style={{
                        position: 'fixed',
                        bottom: '100px',
                        right: '28px',
                        width: '370px',
                        maxHeight: '540px',
                        borderRadius: '20px',
                        background: '#0d1117',
                        border: '1px solid rgba(57,169,0,0.25)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        zIndex: 9998,
                        animation: 'chatSlideUp 0.25s ease-out',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #39a900 0%, #2d8a00 100%)',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}>
                        <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '22px' }}>
                            smart_toy
                        </span>
                        <div style={{ flex: 1 }}>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', lineHeight: 1.2 }}>
                                Asistente SenaAccess
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px' }}>
                                Impulsado por Gemini AI
                            </div>
                        </div>
                        <button
                            onClick={clearChat}
                            title="Limpiar chat"
                            style={{
                                background: 'rgba(255,255,255,0.15)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                color: '#fff',
                                fontSize: '11px',
                            }}
                        >
                            Limpiar
                        </button>
                    </div>

                    {/* Mensajes */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#39a900 transparent',
                    }}>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                }}
                            >
                                <div style={{
                                    maxWidth: '82%',
                                    padding: '10px 14px',
                                    borderRadius: msg.role === 'user'
                                        ? '18px 18px 4px 18px'
                                        : '18px 18px 18px 4px',
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, #39a900, #2d8a00)'
                                        : 'rgba(255,255,255,0.07)',
                                    color: '#f0f0f0',
                                    fontSize: '13px',
                                    lineHeight: 1.5,
                                    border: msg.role === 'model' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {renderText(msg.text)}
                                </div>
                            </div>
                        ))}

                        {/* Indicador de carga */}
                        {isLoading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <div style={{
                                    padding: '10px 16px',
                                    borderRadius: '18px 18px 18px 4px',
                                    background: 'rgba(255,255,255,0.07)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    gap: '5px',
                                    alignItems: 'center',
                                }}>
                                    {[0, 1, 2].map((i) => (
                                        <div key={i} style={{
                                            width: '7px',
                                            height: '7px',
                                            borderRadius: '50%',
                                            background: '#39a900',
                                            animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sugerencias rápidas */}
                        {showSuggestions && !isLoading && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                {QUICK_SUGGESTIONS.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(s)}
                                        style={{
                                            background: 'rgba(57,169,0,0.12)',
                                            border: '1px solid rgba(57,169,0,0.3)',
                                            borderRadius: '20px',
                                            color: '#7dd56f',
                                            fontSize: '11px',
                                            padding: '5px 10px',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(57,169,0,0.25)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(57,169,0,0.12)'}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '12px 14px',
                        borderTop: '1px solid rgba(255,255,255,0.07)',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-end',
                        background: 'rgba(255,255,255,0.03)',
                    }}>
                        <textarea
                            ref={inputRef}
                            id="chatbot-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe tu pregunta..."
                            rows={1}
                            disabled={isLoading}
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.07)',
                                border: '1px solid rgba(57,169,0,0.25)',
                                borderRadius: '12px',
                                color: '#f0f0f0',
                                padding: '9px 13px',
                                fontSize: '13px',
                                resize: 'none',
                                outline: 'none',
                                lineHeight: 1.4,
                                maxHeight: '80px',
                                overflowY: 'auto',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#39a900'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(57,169,0,0.25)'}
                        />
                        <button
                            id="chatbot-send-btn"
                            onClick={() => sendMessage()}
                            disabled={isLoading || !input.trim()}
                            title="Enviar (Enter)"
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '12px',
                                background: input.trim() && !isLoading
                                    ? 'linear-gradient(135deg, #39a900, #2d8a00)'
                                    : 'rgba(255,255,255,0.08)',
                                border: 'none',
                                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s',
                                flexShrink: 0,
                            }}
                        >
                            <span className="material-symbols-outlined" style={{
                                color: input.trim() && !isLoading ? '#fff' : 'rgba(255,255,255,0.3)',
                                fontSize: '20px',
                            }}>
                                send
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── Keyframes CSS ────────────────────────────────────────── */}
            <style>{`
                @keyframes chatSlideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)   scale(1);    }
                }
                @keyframes chatDot {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                    40%           { transform: scale(1);   opacity: 1;   }
                }
                #chatbot-window::-webkit-scrollbar { width: 4px; }
                #chatbot-window::-webkit-scrollbar-thumb { background: #39a900; border-radius: 4px; }
            `}</style>
        </>
    );
};

export default ChatbotWidget;
