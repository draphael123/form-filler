// Data formatting utilities

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format based on length
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  // Return original if can't format
  return phone;
}

export function formatDate(date: string): string {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    
    // Format as MM/DD/YYYY
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch {
    return date;
  }
}

export function formatState(state: string): string {
  if (!state) return '';
  
  // State abbreviation mapping
  const stateMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
  };
  
  const stateLower = state.toLowerCase().trim();
  
  // If already 2 letters, return uppercase
  if (state.length === 2) {
    return state.toUpperCase();
  }
  
  // Try to find abbreviation
  return stateMap[stateLower] || state;
}

export function formatZipCode(zip: string): string {
  if (!zip) return '';
  
  // Remove non-digits
  const digits = zip.replace(/\D/g, '');
  
  // Format as 12345 or 12345-6789
  if (digits.length === 5) {
    return digits;
  } else if (digits.length === 9) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  
  return zip;
}

export function formatEmail(email: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

// Auto-format based on field name
export function autoFormat(fieldName: string, value: string): string {
  if (!value) return '';
  
  const fieldLower = fieldName.toLowerCase();
  
  if (fieldLower.includes('phone') || fieldLower.includes('tel')) {
    return formatPhoneNumber(value);
  }
  
  if (fieldLower.includes('date')) {
    return formatDate(value);
  }
  
  if (fieldLower.includes('state') && !fieldLower.includes('license')) {
    return formatState(value);
  }
  
  if (fieldLower.includes('zip') || fieldLower.includes('postal')) {
    return formatZipCode(value);
  }
  
  if (fieldLower.includes('email')) {
    return formatEmail(value);
  }
  
  return value;
}

