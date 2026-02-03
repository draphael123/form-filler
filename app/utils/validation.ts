// Field validation utilities

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: true }; // Empty is OK (optional field)
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true };
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: true };
  }
  
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) {
    return { isValid: false, error: 'Phone number must be 10-11 digits' };
  }
  
  return { isValid: true };
}

export function validateZipCode(zip: string): ValidationResult {
  if (!zip) {
    return { isValid: true };
  }
  
  const digits = zip.replace(/\D/g, '');
  if (digits.length !== 5 && digits.length !== 9) {
    return { isValid: false, error: 'ZIP code must be 5 or 9 digits' };
  }
  
  return { isValid: true };
}

export function validateState(state: string): ValidationResult {
  if (!state) {
    return { isValid: true };
  }
  
  const validStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
  ];
  
  if (state.length === 2 && validStates.includes(state.toUpperCase())) {
    return { isValid: true };
  }
  
  // Allow full state names too
  return { isValid: true };
}

export function validateField(fieldName: string, value: string): ValidationResult {
  if (!value) {
    return { isValid: true }; // Empty values are OK (handled by required field check)
  }
  
  const fieldLower = fieldName.toLowerCase();
  
  if (fieldLower.includes('email')) {
    return validateEmail(value);
  }
  
  if (fieldLower.includes('phone') || fieldLower.includes('tel')) {
    return validatePhone(value);
  }
  
  if (fieldLower.includes('zip') || fieldLower.includes('postal')) {
    return validateZipCode(value);
  }
  
  if (fieldLower.includes('state') && !fieldLower.includes('license')) {
    return validateState(value);
  }
  
  return { isValid: true };
}

