import React, { useState, useRef, useEffect } from 'react';

interface SliderCaptchaProps {
  onSuccess: (token: string) => void;
  onClose: () => void;
}

const SliderCaptcha: React.FC<SliderCaptchaProps> = ({ onSuccess, onClose }) => {
  const [captchaData, setCaptchaData] = useState<{
    token: string;
    backgroundWidth: number;
    backgroundHeight: number;
    sliderWidth: number;
    sliderHeight: number;
    targetPosition: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [status, setStatus] = useState<'idle' | 'dragging' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startPositionRef = useRef(0);

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const fetchCaptcha = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/captcha/slider');
      const data = await response.json();
      setCaptchaData({
        token: data.token,
        backgroundWidth: data.backgroundWidth,
        backgroundHeight: data.backgroundHeight,
        sliderWidth: data.sliderWidth,
        sliderHeight: data.sliderHeight,
        targetPosition: data.targetPosition,
      });
      setPosition(0);
      setStatus('idle');
      setMessage('');
    } catch (error) {
      console.error('获取验证码失败:', error);
      setMessage('获取验证码失败，请刷新重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (status === 'success' || status === 'error' || isLoading) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    startPositionRef.current = position;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !captchaData) return;

      const deltaX = e.clientX - startXRef.current;
      const containerRect = containerRef.current?.getBoundingClientRect();
      const scale = containerRect ? captchaData.backgroundWidth / containerRect.width : 1;
      const newPosition = Math.max(0, Math.min(startPositionRef.current + deltaX * scale, captchaData.backgroundWidth - captchaData.sliderWidth));
      
      setPosition(newPosition);
      setStatus('dragging');
    };

    const handleMouseUp = async () => {
      if (!isDragging || !captchaData) return;
      setIsDragging(false);

      setIsLoading(true);
      try {
        const response = await fetch('/api/captcha/slider/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: captchaData.token,
            position: Math.round(position),
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          setStatus('success');
          setMessage('验证成功');
          setTimeout(() => {
            onSuccess(captchaData.token);
          }, 800);
        } else {
          setStatus('error');
          setMessage(data.message || '验证失败，请重试');
          setTimeout(() => {
            setPosition(0);
            setStatus('idle');
            setMessage('');
            fetchCaptcha();
          }, 1500);
        }
      } catch (error) {
        setStatus('error');
        setMessage('验证失败，请重试');
        setTimeout(() => {
          setPosition(0);
          setStatus('idle');
          setMessage('');
          fetchCaptcha();
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position, captchaData, onSuccess]);

  if (!captchaData || isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          width: '90%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '3px solid #6366f1',
              borderRadius: '50%',
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }}></div>
            <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748b', fontSize: '14px', fontWeight: '500' }}>
              {isLoading ? '加载中...' : '获取验证码失败'}
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(8px)',
    animation: 'fadeIn 0.3s ease',
  };

  return (
    <div style={overlayStyle}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '28px',
        width: '90%',
        maxWidth: '440px',
        margin: '0 16px',
        animation: 'scaleIn 0.3s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#6366f1',
              borderRadius: '50%',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
            }}></div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>滑块验证</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.backgroundColor = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0', fontWeight: '500' }}>请拖动滑块完成验证</p>

        <div
          ref={containerRef}
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
            borderRadius: '12px',
            overflow: 'hidden',
            width: captchaData.backgroundWidth,
            height: captchaData.backgroundHeight,
            margin: '0 auto',
            boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              left: captchaData.targetPosition,
              top: (captchaData.backgroundHeight - captchaData.sliderHeight) / 2,
              width: captchaData.sliderWidth,
              height: captchaData.sliderHeight,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <svg width="26" height="26" fill="none" stroke="#64748b" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>

          <div
            style={{
              position: 'absolute',
              top: '50%',
              transform: `translateY(-50%) translateX(${position}px)`,
              background: status === 'success' 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                : status === 'error' 
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              userSelect: 'none',
              boxShadow: status === 'success' 
                ? '0 4px 20px rgba(16, 185, 129, 0.4)' 
                : status === 'error' 
                  ? '0 4px 20px rgba(239, 68, 68, 0.4)' 
                  : '0 4px 20px rgba(99, 102, 241, 0.4)',
              width: captchaData.sliderWidth,
              height: captchaData.sliderHeight,
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, background 0.3s ease',
              opacity: isLoading ? 0.7 : 1,
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
            onMouseDown={handleMouseDown}
          >
            <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24">
              {status === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : status === 'error' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </div>
        </div>

        {message && (
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            padding: '12px',
            borderRadius: '10px',
            background: status === 'success' 
              ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' 
              : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            animation: 'slideUp 0.3s ease',
          }}>
            <p style={{
              color: status === 'success' ? '#065f46' : '#991b1b',
              fontSize: '14px',
              margin: 0,
              fontWeight: '500',
            }}>
              {message}
            </p>
          </div>
        )}

        <button
          onClick={fetchCaptcha}
          disabled={isLoading || status === 'success'}
          style={{
            marginTop: message ? '12px' : '20px',
            width: '100%',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            border: 'none',
            borderRadius: '10px',
            cursor: isLoading || status === 'success' ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            color: '#475569',
            fontWeight: '500',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            opacity: isLoading || status === 'success' ? 0.5 : 1,
          }}
          onMouseEnter={(e) => !isLoading && status !== 'success' && (e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)')}
          onMouseLeave={(e) => !isLoading && status !== 'success' && (e.currentTarget.style.background = 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)')}
        >
          {isLoading ? '刷新中...' : '刷新验证码'}
        </button>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SliderCaptcha;