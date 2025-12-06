/**
 * SSO Attribute Mapper
 * Maps identity provider attributes to application user fields
 */

// Default attribute mappings for common identity providers
export const DEFAULT_MAPPINGS = {
  // Standard OIDC/OAuth claims
  oidc: {
    email: ['email'],
    first_name: ['given_name', 'firstName', 'first_name'],
    last_name: ['family_name', 'lastName', 'last_name', 'surname'],
    display_name: ['name', 'displayName', 'display_name'],
    employee_id: ['employee_id', 'employeeId', 'employeeNumber', 'employee_number'],
    department: ['department', 'dept'],
    job_title: ['job_title', 'jobTitle', 'title'],
    groups: ['groups', 'memberOf', 'roles'],
    phone: ['phone_number', 'phone', 'phoneNumber'],
    picture: ['picture', 'photo', 'avatar']
  },

  // SAML attribute names (various formats)
  saml: {
    email: [
      'email',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      'http://schemas.xmlsoap.org/claims/EmailAddress',
      'urn:oid:0.9.2342.19200300.100.1.3',
      'mail'
    ],
    first_name: [
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
      'http://schemas.xmlsoap.org/claims/GivenName',
      'urn:oid:2.5.4.42',
      'givenName',
      'firstName'
    ],
    last_name: [
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
      'http://schemas.xmlsoap.org/claims/Surname',
      'urn:oid:2.5.4.4',
      'sn',
      'lastName',
      'surname'
    ],
    display_name: [
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
      'http://schemas.microsoft.com/identity/claims/displayname',
      'urn:oid:2.16.840.1.113730.3.1.241',
      'displayName',
      'cn'
    ],
    employee_id: [
      'employeeID',
      'employeeNumber',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/employeeid'
    ],
    department: [
      'department',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department',
      'urn:oid:2.5.4.11'
    ],
    job_title: [
      'title',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/title',
      'urn:oid:2.5.4.12'
    ],
    groups: [
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups',
      'http://schemas.xmlsoap.org/claims/Group',
      'memberOf',
      'groups'
    ],
    upn: [
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn',
      'userPrincipalName'
    ]
  },

  // Provider-specific mappings
  azure_ad: {
    email: ['email', 'preferred_username', 'upn'],
    first_name: ['given_name', 'givenname'],
    last_name: ['family_name', 'surname'],
    display_name: ['name', 'displayName'],
    employee_id: ['employeeid', 'onpremisesemployeeid'],
    department: ['department'],
    job_title: ['jobtitle', 'jobTitle'],
    groups: ['groups', 'wids'],
    tenant_id: ['tid']
  },

  okta: {
    email: ['email'],
    first_name: ['given_name', 'firstName'],
    last_name: ['family_name', 'lastName'],
    display_name: ['name'],
    employee_id: ['employeeNumber'],
    department: ['department'],
    job_title: ['title'],
    groups: ['groups']
  },

  google: {
    email: ['email'],
    first_name: ['given_name'],
    last_name: ['family_name'],
    display_name: ['name'],
    picture: ['picture'],
    hd: ['hd'] // Hosted domain
  },

  onelogin: {
    email: ['email', 'Email'],
    first_name: ['firstname', 'firstName', 'given_name'],
    last_name: ['lastname', 'lastName', 'family_name'],
    display_name: ['name'],
    employee_id: ['employeeNumber'],
    department: ['department'],
    job_title: ['title'],
    groups: ['memberOf']
  }
};

/**
 * Get value from nested object using dot notation
 * @param {object} obj - Source object
 * @param {string} path - Dot-notation path (e.g., 'user.profile.email')
 * @returns {*} - Value at path or undefined
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }

  return current;
}

/**
 * Find first matching attribute from a list of possible names
 * @param {object} attributes - Source attributes
 * @param {string[]} possibleNames - List of possible attribute names
 * @returns {*} - First found value or undefined
 */
function findAttribute(attributes, possibleNames) {
  if (!attributes || !possibleNames) return undefined;

  for (const name of possibleNames) {
    const value = getNestedValue(attributes, name);
    if (value !== undefined && value !== null && value !== '') {
      // Handle array values (take first element if single value expected)
      if (Array.isArray(value) && value.length === 1) {
        return value[0];
      }
      return value;
    }
  }

  return undefined;
}

/**
 * Map IdP attributes to user fields
 * @param {object} idpAttributes - Raw attributes from identity provider
 * @param {object} customMapping - Custom attribute mapping configuration
 * @param {string} providerType - Provider type ('saml', 'oidc', 'oauth2')
 * @param {string} providerVendor - Provider vendor ('okta', 'azure_ad', etc.)
 * @returns {object} - Mapped user attributes
 */
export function mapAttributes(idpAttributes, customMapping = {}, providerType = 'oidc', providerVendor = null) {
  if (!idpAttributes) return {};

  // Get default mapping based on provider type and vendor
  const defaultMapping = providerVendor && DEFAULT_MAPPINGS[providerVendor]
    ? DEFAULT_MAPPINGS[providerVendor]
    : DEFAULT_MAPPINGS[providerType] || DEFAULT_MAPPINGS.oidc;

  // Merge custom mapping with defaults (custom takes precedence)
  const mapping = { ...defaultMapping };

  // Apply custom mapping overrides
  if (customMapping) {
    for (const [field, sourceAttr] of Object.entries(customMapping)) {
      if (sourceAttr) {
        // Custom mapping can be a string or array
        mapping[field] = Array.isArray(sourceAttr) ? sourceAttr : [sourceAttr];
      }
    }
  }

  // Map attributes
  const result = {};

  for (const [field, possibleNames] of Object.entries(mapping)) {
    const names = Array.isArray(possibleNames) ? possibleNames : [possibleNames];
    const value = findAttribute(idpAttributes, names);

    if (value !== undefined) {
      result[field] = value;
    }
  }

  // Ensure email is present (required field)
  if (!result.email) {
    // Try common fallbacks
    result.email = idpAttributes.email ||
      idpAttributes.nameID ||
      idpAttributes.sub ||
      idpAttributes.preferred_username;
  }

  // Generate display_name if not present
  if (!result.display_name && (result.first_name || result.last_name)) {
    result.display_name = [result.first_name, result.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  // Normalize groups to array
  if (result.groups && !Array.isArray(result.groups)) {
    result.groups = [result.groups];
  }

  return result;
}

/**
 * Map IdP groups to application roles
 * @param {string[]} idpGroups - Groups from identity provider
 * @param {object} groupMapping - Group-to-role mapping configuration
 * @param {string} defaultRole - Default role if no mapping matches
 * @returns {string} - Application role
 */
export function mapGroupsToRole(idpGroups, groupMapping = {}, defaultRole = 'employee') {
  if (!idpGroups || !Array.isArray(idpGroups) || idpGroups.length === 0) {
    return defaultRole;
  }

  // Priority order for roles (highest to lowest)
  const rolePriority = ['super_admin', 'hr_admin', 'ic_member', 'employee'];

  // Check each group against mapping
  let highestRole = null;
  let highestPriority = rolePriority.length;

  for (const group of idpGroups) {
    const normalizedGroup = group.toLowerCase();

    // Check custom mapping first
    for (const [idpGroup, appRole] of Object.entries(groupMapping)) {
      if (normalizedGroup === idpGroup.toLowerCase() ||
          normalizedGroup.includes(idpGroup.toLowerCase())) {
        const priority = rolePriority.indexOf(appRole);
        if (priority !== -1 && priority < highestPriority) {
          highestRole = appRole;
          highestPriority = priority;
        }
      }
    }

    // Check for common patterns if no custom mapping
    if (!Object.keys(groupMapping).length) {
      if (normalizedGroup.includes('admin') || normalizedGroup.includes('hr_admin')) {
        const priority = rolePriority.indexOf('hr_admin');
        if (priority < highestPriority) {
          highestRole = 'hr_admin';
          highestPriority = priority;
        }
      } else if (normalizedGroup.includes('ic') || normalizedGroup.includes('investigation')) {
        const priority = rolePriority.indexOf('ic_member');
        if (priority < highestPriority) {
          highestRole = 'ic_member';
          highestPriority = priority;
        }
      }
    }
  }

  return highestRole || defaultRole;
}

/**
 * Validate mapped attributes
 * @param {object} mappedAttributes - Mapped user attributes
 * @returns {object} - { valid: boolean, errors: string[] }
 */
export function validateMappedAttributes(mappedAttributes) {
  const errors = [];

  // Email is required
  if (!mappedAttributes.email) {
    errors.push('Email attribute is required but not found in IdP response');
  } else if (!isValidEmail(mappedAttributes.email)) {
    errors.push(`Invalid email format: ${mappedAttributes.email}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Simple email validation
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract domain from email
 * @param {string} email - Email address
 * @returns {string|null} - Domain or null
 */
export function extractDomain(email) {
  if (!email || typeof email !== 'string') return null;
  const parts = email.split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

export default {
  mapAttributes,
  mapGroupsToRole,
  validateMappedAttributes,
  extractDomain,
  DEFAULT_MAPPINGS
};
