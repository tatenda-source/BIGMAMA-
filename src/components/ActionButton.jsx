import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const ActionButton = ({ 
  onClick, 
  children, 
  type = 'button', 
  variant = 'primary', 
  className, 
  style, 
  disabled,
  icon: Icon
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "action-button",
        isPrimary && "btn-primary",
        isSecondary && "btn-secondary",
        isDanger && "btn-danger",
        className
      )}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style
      }}
    >
      {children}
      {Icon && <Icon size={18} />}
    </motion.button>
  );
};

export default ActionButton;
