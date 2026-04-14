import React, { useId } from 'react';
import clsx from 'clsx';
import './primitives.css';

/**
 * FormSection — wraps a labeled input and binds label/hint/error via
 * aria-describedby and htmlFor. Does not render its own input; clone
 * the child to inject id / aria attributes so callers keep full control
 * of the actual form control.
 *
 * @typedef {Object} FormSectionProps
 * @property {string} label
 * @property {React.ReactElement} children        A single form control element.
 * @property {string} [hint]                      Helper text below the field.
 * @property {string} [error]                     Error text; styles the section red and sets aria-invalid.
 * @property {boolean} [required=false]
 * @property {string} [id]                        Optional stable id; auto-generated otherwise.
 * @property {string} [className]
 * @property {React.CSSProperties} [style]
 * @property {React.ReactNode} [labelAside]       Optional right-aligned aside (e.g. char count).
 *
 * @param {FormSectionProps} props
 */
const FormSection = React.forwardRef(function FormSection(
  {
    label,
    children,
    hint,
    error,
    required = false,
    id,
    className,
    style,
    labelAside,
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const fieldId = id || `bm-field-${generatedId}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const child = React.Children.only(children);
  const clonedChild = React.cloneElement(child, {
    id: child.props.id || fieldId,
    'aria-describedby':
      [child.props['aria-describedby'], describedBy].filter(Boolean).join(' ') ||
      undefined,
    'aria-invalid': error ? true : child.props['aria-invalid'],
    'aria-required': required || child.props['aria-required'],
  });

  return (
    <div
      ref={ref}
      className={clsx(
        'bm-form-section',
        error && 'bm-form-section--error',
        className
      )}
      style={style}
      {...rest}
    >
      <div className="bm-form-section__label-row">
        <label htmlFor={fieldId} className="bm-form-section__label">
          {label}
          {required ? (
            <span
              className="bm-form-section__required"
              aria-hidden="true"
              title="required"
            >
              *
            </span>
          ) : null}
        </label>
        {labelAside ? <span>{labelAside}</span> : null}
      </div>
      {clonedChild}
      {hint && !error ? (
        <p id={hintId} className="bm-form-section__hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="bm-form-section__error">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export default FormSection;
