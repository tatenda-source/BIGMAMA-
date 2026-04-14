import React, { useId } from 'react';

const FormInput = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  textarea = false,
  error,
  required = false,
  maxLength,
  autoComplete,
  id,
}) => {
  const reactId = useId();
  const inputId = id || reactId;
  const errorId = `${inputId}-error`;

  const sharedProps = {
    id: inputId,
    value,
    onChange,
    placeholder,
    required,
    maxLength,
    autoComplete,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': error ? errorId : undefined,
    className: 'bm-form-input',
  };

  return (
    <div className="bm-form-field">
      <label htmlFor={inputId} className="bm-form-label">
        {label}
        {required && <span aria-hidden="true" className="bm-form-required">*</span>}
      </label>
      {textarea ? (
        <textarea {...sharedProps} rows={5} />
      ) : (
        <input type={type} {...sharedProps} />
      )}
      {error && (
        <p id={errorId} role="alert" className="bm-form-error">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
