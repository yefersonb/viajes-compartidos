// src/components/ActionButton.jsx
import React from 'react';

const base = {
  padding: '6px 14px',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  border: '1px solid transparent',
  background: '#f1f5f9',
};

const variants = {
  primary: {
    background: '#2563eb',
    color: '#fff',
    border: '1px solid #2563eb',
  },
  neutral: {
    background: '#f1f5f9',
    color: '#2563eb',
    border: '1px solid #2563eb',
  },
  destructive: {
    background: '#ffe3e3',
    color: '#c0392b',
    border: '1px solid #c0392b',
  },
  success: {
    background: '#22c55e',
    color: '#fff',
    border: '1px solid #22c55e',
  },
};

export default function ActionButton({
  children,
  variant = 'neutral',
  disabled = false,
  style = {},
  ...props
}) {
  const variantStyle = variants[variant] || variants.neutral;
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        ...base,
        ...variantStyle,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
