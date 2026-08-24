import type { ChangeEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

type InputType = "text" | "email" | "password";

interface FormInputProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  type?: InputType;
  autoComplete?: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  containerClassName?: string;
  passwordWrapperClassName?: string;
  passwordToggleClassName?: string;
  showPasswordToggle?: boolean;
  isPasswordVisible?: boolean;
  onTogglePassword?: () => void;
}

const FormInput = ({
  id,
  label,
  value,
  placeholder,
  type = "text",
  autoComplete,
  error,
  onChange,
  containerClassName = "input-group",
  passwordWrapperClassName = "password-wrapper",
  passwordToggleClassName = "password-toggle",
  showPasswordToggle = false,
  isPasswordVisible = false,
  onTogglePassword,
}: FormInputProps) => {
  const resolvedInputType =
    type === "password" && showPasswordToggle
      ? isPasswordVisible
        ? "text"
        : "password"
      : type;

  const passwordToggleLabel = isPasswordVisible ? "Hide password" : "Show password";

  const renderInput = () => {
    if (!showPasswordToggle) {
      return (
        <input
          id={id}
          type={resolvedInputType}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={onChange}
        />
      );
    }

    return (
      <div className={passwordWrapperClassName}>
        <input
          id={id}
          type={resolvedInputType}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={onChange}
        />

        <button
          type="button"
          className={passwordToggleClassName}
          onClick={onTogglePassword}
          aria-label={passwordToggleLabel}
        >
          {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    );
  };

  return (
    <div className={containerClassName}>
      <label htmlFor={id}>{label}</label>
      {renderInput()}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
};

export default FormInput;
