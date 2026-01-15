// securityService.js - Servicio de Seguridad
// Versión: 1.0 - Implementación de capas de seguridad para autenticación
// Incluye: sanitización, validación, rate limiting, y protección contra ataques

// ============================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================

const SECURITY_CONFIG = {
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutos
  ATTEMPT_WINDOW_MS: 5 * 60 * 1000, // 5 minutos

  // Validación de contraseña
  MIN_PASSWORD_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: true,

  // Sanitización
  MAX_EMAIL_LENGTH: 254,
  MAX_PASSWORD_LENGTH: 128,
  MAX_NAME_LENGTH: 100,
};

// ============================================
// ALMACENAMIENTO SEGURO EN MEMORIA
// ============================================

// Almacenamiento temporal de intentos (en memoria, se resetea al recargar)
const loginAttempts = new Map();

// ============================================
// SANITIZACIÓN DE INPUTS
// ============================================

/**
 * Sanitiza un string eliminando caracteres potencialmente peligrosos
 * @param {string} input - Input a sanitizar
 * @returns {string} - Input sanitizado
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';

  // eslint-disable-next-line no-control-regex
  const controlCharsRegex = /[\u0000-\u001F\u007F]/g;

  return input
    // Eliminar caracteres de control
    .replace(controlCharsRegex, '')
    // Escapar caracteres HTML peligrosos
    .replace(/[<>]/g, '')
    // Eliminar scripts inline
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    // Trim espacios
    .trim();
};

// Lista de dominios de email válidos y conocidos
const VALID_EMAIL_DOMAINS = [
  // Google
  'gmail.com', 'googlemail.com',
  // Microsoft
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'outlook.es',
  // Yahoo
  'yahoo.com', 'yahoo.es', 'yahoo.com.mx',
  // Apple
  'icloud.com', 'me.com', 'mac.com',
  // Otros proveedores populares
  'protonmail.com', 'proton.me', 'zoho.com',
  // Proveedores regionales
  'terra.com', 'terra.com.mx', 'att.net',
  // Corporativos comunes en México/Latinoamérica
  'telmex.com', 'infinitum.com.mx',
];

// Dominios typosquatting conocidos (falsos que parecen reales)
const TYPOSQUATTING_DOMAINS = [
  // Gmail typos
  'gmail.co', 'gmail.cm', 'gmail.om', 'gmail.con', 'gmail.comm',
  'gmial.com', 'gmal.com', 'gmai.com', 'gamil.com', 'gnail.com',
  'gmail.net', 'gmail.org', 'g-mail.com', 'googlemail.co',
  // Hotmail typos
  'hotmail.co', 'hotmal.com', 'hotmai.com', 'hotmial.com',
  'hotmail.con', 'hotmail.cm', 'hotmail.om',
  // Outlook typos
  'outlook.co', 'outloo.com', 'outlok.com', 'outlook.cm',
  // Yahoo typos
  'yahoo.co', 'yaho.com', 'yahooo.com', 'yahoo.cm',
  // Otros
  'icloud.co', 'protonmail.co',
];

// TLDs válidos más comunes
const VALID_TLDS = [
  'com', 'net', 'org', 'edu', 'gov', 'mil',
  'es', 'mx', 'co', 'ar', 'cl', 'pe', 've', 'ec', 'bo', 'py', 'uy',
  'uk', 'de', 'fr', 'it', 'pt', 'br',
  'io', 'me', 'info', 'biz', 'cloud',
  'com.mx', 'com.ar', 'com.co', 'com.es', 'co.uk',
];

/**
 * Sanitiza y valida un email
 * Incluye detección de typosquatting y validación de dominios
 * @param {string} email - Email a sanitizar
 * @returns {Object} - { isValid, sanitized, error, warning }
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, sanitized: '', error: 'Email es requerido' };
  }

  // Sanitización básica
  let sanitized = email.toLowerCase().trim();

  // Validar longitud
  if (sanitized.length > SECURITY_CONFIG.MAX_EMAIL_LENGTH) {
    return { isValid: false, sanitized: '', error: 'Email demasiado largo' };
  }

  // Validar formato con regex estricto
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(sanitized)) {
    return { isValid: false, sanitized: '', error: 'Formato de email inválido' };
  }

  const domain = sanitized.split('@')[1];
  const tld = domain.split('.').slice(-1)[0];
  const fullTld = domain.split('.').slice(-2).join('.');

  // 1. Verificar typosquatting (dominios falsos que parecen reales)
  if (TYPOSQUATTING_DOMAINS.includes(domain)) {
    const suggestion = getSuggestedDomain(domain);
    return {
      isValid: false,
      sanitized: '',
      error: `El dominio "${domain}" no existe. ¿Quisiste decir "${suggestion}"?`
    };
  }

  // 2. Verificar dominios temporales/desechables
  const suspiciousDomains = ['tempmail', 'throwaway', 'guerrilla', 'mailinator', '10minutemail', 'fakeinbox', 'trashmail'];
  if (suspiciousDomains.some(d => domain.includes(d))) {
    return { isValid: false, sanitized: '', error: 'No se permiten emails temporales' };
  }

  // 3. Validar TLD
  if (!VALID_TLDS.includes(tld) && !VALID_TLDS.includes(fullTld)) {
    return {
      isValid: false,
      sanitized: '',
      error: `El dominio ".${tld}" no es válido. Verifica tu email`
    };
  }

  // 4. Advertencia si no es un dominio conocido (pero permitir)
  let warning = null;
  if (!VALID_EMAIL_DOMAINS.includes(domain) && !domain.includes('.')) {
    warning = 'Dominio no reconocido. Verifica que sea correcto.';
  }

  return { isValid: true, sanitized, error: null, warning };
};

/**
 * Sugiere el dominio correcto basado en typosquatting
 */
const getSuggestedDomain = (wrongDomain) => {
  const suggestions = {
    'gmail.co': 'gmail.com',
    'gmail.cm': 'gmail.com',
    'gmail.om': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmail.comm': 'gmail.com',
    'gmial.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'hotmail.co': 'hotmail.com',
    'hotmal.com': 'hotmail.com',
    'outlook.co': 'outlook.com',
    'yahoo.co': 'yahoo.com',
  };
  return suggestions[wrongDomain] || 'gmail.com';
};

/**
 * Sanitiza una contraseña (no modifica, solo valida caracteres)
 * @param {string} password - Contraseña a validar
 * @returns {Object} - { isValid, error }
 */
export const sanitizePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Contraseña es requerida' };
  }

  // Validar longitud máxima (prevenir DoS)
  if (password.length > SECURITY_CONFIG.MAX_PASSWORD_LENGTH) {
    return { isValid: false, error: 'Contraseña demasiado larga' };
  }

  // No sanitizamos la contraseña para no alterar caracteres especiales válidos
  return { isValid: true, error: null };
};

/**
 * Sanitiza un nombre de usuario
 * @param {string} name - Nombre a sanitizar
 * @returns {Object} - { isValid, sanitized, error }
 */
export const sanitizeName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, sanitized: '', error: 'Nombre es requerido' };
  }

  // Sanitización
  let sanitized = sanitizeInput(name);

  // Validar longitud
  if (sanitized.length > SECURITY_CONFIG.MAX_NAME_LENGTH) {
    return { isValid: false, sanitized: '', error: 'Nombre demasiado largo' };
  }

  if (sanitized.length < 2) {
    return { isValid: false, sanitized: '', error: 'Nombre demasiado corto' };
  }

  // Validar caracteres permitidos (letras, espacios, acentos)
  const nameRegex = /^[a-zA-ZÀ-ÿñÑ\s'-]+$/;
  if (!nameRegex.test(sanitized)) {
    return { isValid: false, sanitized: '', error: 'Nombre contiene caracteres no permitidos' };
  }

  return { isValid: true, sanitized, error: null };
};

// ============================================
// VALIDACIÓN DE COMPLEJIDAD DE CONTRASEÑA
// ============================================

/**
 * Valida la complejidad de una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} - { isValid, errors, strength }
 */
export const validatePasswordStrength = (password) => {
  const errors = [];
  let strength = 0;

  if (!password) {
    return { isValid: false, errors: ['Contraseña es requerida'], strength: 0 };
  }

  // Longitud mínima
  if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
    errors.push(`Mínimo ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} caracteres`);
  } else {
    strength += 1;
  }

  // Mayúsculas
  if (SECURITY_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Debe incluir al menos una mayúscula');
  } else if (/[A-Z]/.test(password)) {
    strength += 1;
  }

  // Minúsculas
  if (SECURITY_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Debe incluir al menos una minúscula');
  } else if (/[a-z]/.test(password)) {
    strength += 1;
  }

  // Números
  if (SECURITY_CONFIG.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push('Debe incluir al menos un número');
  } else if (/[0-9]/.test(password)) {
    strength += 1;
  }

  // Caracteres especiales
  if (SECURITY_CONFIG.REQUIRE_SPECIAL_CHAR && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Debe incluir al menos un carácter especial (!@#$%^&*...)');
  } else if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    strength += 1;
  }

  // Bonus por longitud extra
  if (password.length >= 12) strength += 1;
  if (password.length >= 16) strength += 1;

  // Verificar contraseñas comunes (lista básica)
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Esta contraseña es muy común, elige otra');
    strength = 0;
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: Math.min(strength, 5), // Máximo 5
    strengthLabel: getStrengthLabel(strength)
  };
};

/**
 * Obtiene la etiqueta de fortaleza
 */
const getStrengthLabel = (strength) => {
  if (strength <= 1) return 'Muy débil';
  if (strength === 2) return 'Débil';
  if (strength === 3) return 'Moderada';
  if (strength === 4) return 'Fuerte';
  return 'Muy fuerte';
};

// ============================================
// RATE LIMITING
// ============================================

/**
 * Verifica si el usuario está bloqueado por demasiados intentos
 * @param {string} identifier - Email o IP del usuario
 * @returns {Object} - { isBlocked, remainingAttempts, lockoutEndTime }
 */
export const checkRateLimit = (identifier) => {
  const now = Date.now();
  const key = identifier.toLowerCase();

  // Obtener registro de intentos
  let record = loginAttempts.get(key);

  // Si no hay registro o expiró el lockout, resetear
  if (!record || (record.lockoutUntil && record.lockoutUntil < now)) {
    record = {
      attempts: [],
      lockoutUntil: null
    };
    loginAttempts.set(key, record);
  }

  // Si está en lockout
  if (record.lockoutUntil && record.lockoutUntil > now) {
    const remainingMs = record.lockoutUntil - now;
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    return {
      isBlocked: true,
      remainingAttempts: 0,
      message: `Demasiados intentos. Intenta de nuevo en ${remainingMinutes} minuto(s)`,
      lockoutEndTime: record.lockoutUntil
    };
  }

  // Filtrar intentos dentro de la ventana de tiempo
  record.attempts = record.attempts.filter(
    timestamp => now - timestamp < SECURITY_CONFIG.ATTEMPT_WINDOW_MS
  );

  const remainingAttempts = SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - record.attempts.length;

  return {
    isBlocked: false,
    remainingAttempts,
    message: null,
    lockoutEndTime: null
  };
};

/**
 * Registra un intento de login
 * @param {string} identifier - Email o IP del usuario
 * @param {boolean} success - Si el intento fue exitoso
 */
export const recordLoginAttempt = (identifier, success) => {
  const now = Date.now();
  const key = identifier.toLowerCase();

  // Si fue exitoso, limpiar registro
  if (success) {
    loginAttempts.delete(key);
    return;
  }

  // Obtener o crear registro
  let record = loginAttempts.get(key) || {
    attempts: [],
    lockoutUntil: null
  };

  // Agregar intento fallido
  record.attempts.push(now);

  // Filtrar intentos viejos
  record.attempts = record.attempts.filter(
    timestamp => now - timestamp < SECURITY_CONFIG.ATTEMPT_WINDOW_MS
  );

  // Si excede el límite, aplicar lockout
  if (record.attempts.length >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
    record.lockoutUntil = now + SECURITY_CONFIG.LOCKOUT_DURATION_MS;
  }

  loginAttempts.set(key, record);
};

/**
 * Resetea los intentos de un usuario (usar después de cambio de contraseña)
 * @param {string} identifier - Email del usuario
 */
export const resetLoginAttempts = (identifier) => {
  loginAttempts.delete(identifier.toLowerCase());
};

// ============================================
// PROTECCIÓN XSS
// ============================================

/**
 * Escapa HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
export const escapeHtml = (text) => {
  if (typeof text !== 'string') return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, m => map[m]);
};

// ============================================
// VALIDACIÓN COMPLETA PARA LOGIN
// ============================================

/**
 * Valida y sanitiza los datos de login
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Object} - { isValid, sanitizedEmail, errors }
 */
export const validateLoginInput = (email, password) => {
  const errors = [];

  // Sanitizar email
  const emailResult = sanitizeEmail(email);
  if (!emailResult.isValid) {
    errors.push(emailResult.error);
  }

  // Validar contraseña (solo existencia, no complejidad en login)
  const passwordResult = sanitizePassword(password);
  if (!passwordResult.isValid) {
    errors.push(passwordResult.error);
  }

  return {
    isValid: errors.length === 0,
    sanitizedEmail: emailResult.sanitized,
    errors
  };
};

/**
 * Valida y sanitiza los datos de registro
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @param {string} displayName - Nombre del usuario
 * @returns {Object} - { isValid, sanitizedEmail, sanitizedName, passwordErrors, errors }
 */
export const validateRegisterInput = (email, password, displayName) => {
  const errors = [];

  // Sanitizar email
  const emailResult = sanitizeEmail(email);
  if (!emailResult.isValid) {
    errors.push(emailResult.error);
  }

  // Sanitizar nombre
  const nameResult = sanitizeName(displayName);
  if (!nameResult.isValid) {
    errors.push(nameResult.error);
  }

  // Validar complejidad de contraseña
  const passwordResult = validatePasswordStrength(password);
  if (!passwordResult.isValid) {
    errors.push(...passwordResult.errors);
  }

  return {
    isValid: errors.length === 0,
    sanitizedEmail: emailResult.sanitized,
    sanitizedName: nameResult.sanitized,
    passwordStrength: passwordResult.strength,
    passwordStrengthLabel: passwordResult.strengthLabel,
    errors
  };
};

// ============================================
// PROTECCIÓN ADICIONAL
// ============================================

/**
 * Verifica si la página está en un iframe (protección clickjacking)
 * @returns {boolean}
 */
export const checkClickjacking = () => {
  try {
    if (window.self !== window.top) {
      return true; // Está en iframe
    }
  } catch (e) {
    return true; // Error al acceder indica iframe con diferentes orígenes
  }
  return false;
};

/**
 * Genera un ID de sesión único para tracking de seguridad
 * @returns {string}
 */
export const generateSessionId = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// ============================================
// EXPORTAR CONFIGURACIÓN (solo lectura)
// ============================================

export const getSecurityConfig = () => ({
  minPasswordLength: SECURITY_CONFIG.MIN_PASSWORD_LENGTH,
  maxLoginAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
  lockoutDurationMinutes: SECURITY_CONFIG.LOCKOUT_DURATION_MS / 60000,
});
