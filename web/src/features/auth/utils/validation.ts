export const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const isValidEmail = (value: string): boolean => emailRegex.test(value.trim());

export const isStrongPassword = (value: string): boolean => strongPasswordRegex.test(value);

export const hasMinimumPasswordLength = (value: string): boolean => value.length >= 8;
