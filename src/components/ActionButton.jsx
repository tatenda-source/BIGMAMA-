import { motion } from 'framer-motion';
import { clsx } from 'clsx';

/**
 * Civic Dossier primary CTA. Paper-stamp feel: the button compresses into
 * its own ochre drop-shadow on press. All hover/press treatment lives in
 * .btn-primary (components.css) so this component just composes classes.
 */
const ActionButton = ({
  onClick,
  children,
  type = 'button',
  variant = 'primary',
  className,
  style,
  disabled,
  icon: Icon,
  iconLeading = false,
  ...rest
}) => {
  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'danger'
      ? 'btn-danger'
      : 'btn-secondary';

  return (
    <motion.button
      initial={false}
      whileTap={disabled ? undefined : { y: 1 }}
      transition={{ duration: 0.12, ease: [0.2, 0.7, 0.3, 1] }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx('action-button', variantClass, className)}
      style={style}
      {...rest}
    >
      {Icon && iconLeading ? <Icon size={16} aria-hidden="true" /> : null}
      <span>{children}</span>
      {Icon && !iconLeading ? <Icon size={16} aria-hidden="true" /> : null}
    </motion.button>
  );
};

export default ActionButton;
