import React from "react";

export default function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className = "",
}) {
  return (
    <div className={`block ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-hm-meta font-medium text-hm-text-muted"
        >
          {label}
          {required && (
            <span className="ml-1 text-hm-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-hm-meta text-hm-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-hm-meta text-hm-text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}
