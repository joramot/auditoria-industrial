// authService.js - Servicio de Autenticación
// Versión: 3.0 - SEGURIDAD MEJORADA
// Incluye: sanitización, rate limiting, validación, sin logs sensibles

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInAnonymously,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { createOrUpdateUserRole, ROLES } from '../migration/roleService';
import {
  validateLoginInput,
  validateRegisterInput,
  checkRateLimit,
  recordLoginAttempt,
  sanitizeEmail
} from '../security/securityService';

// ============================================
// MODO DESARROLLO (solo para debugging)
// ============================================
const IS_DEV = process.env.NODE_ENV === 'development';
const secureLog = (message, ...args) => {
  if (IS_DEV) {
    // En desarrollo, solo loguear mensajes sin datos sensibles
    // console.log(message);
  }
};


// ============================================
// AUTENTICACIÓN CON EMAIL Y CONTRASEÑA
// ============================================

/**
 * LOGIN con email y contraseña
 * Incluye: validación, sanitización, rate limiting
 */
export const login = async (email, password) => {
  try {
    // 1. Validar y sanitizar inputs
    const validation = validateLoginInput(email, password);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors[0]
      };
    }

    const sanitizedEmail = validation.sanitizedEmail;

    // 2. Verificar rate limiting
    const rateLimit = checkRateLimit(sanitizedEmail);
    if (rateLimit.isBlocked) {
      return {
        success: false,
        error: rateLimit.message,
        isRateLimited: true
      };
    }

    secureLog('Intentando autenticación...');

    // 3. Intentar login con Firebase
    const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
    const user = userCredential.user;

    // 4. Login exitoso - limpiar intentos fallidos
    recordLoginAttempt(sanitizedEmail, true);
    secureLog('Autenticación exitosa');

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      }
    };
  } catch (error) {
    // Registrar intento fallido (para rate limiting)
    const emailResult = sanitizeEmail(email);
    if (emailResult.isValid) {
      recordLoginAttempt(emailResult.sanitized, false);
    }

    secureLog('Error de autenticación');

    // Mensajes de error genéricos para no exponer información
    let errorMessage = 'Credenciales inválidas';

    switch (error.code) {
      case 'auth/invalid-email':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        // Mensaje genérico para no revelar si el email existe
        errorMessage = 'Email o contraseña incorrectos';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Esta cuenta ha sido deshabilitada';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos. Intenta más tarde';
        break;
      default:
        errorMessage = 'Error al iniciar sesión. Intenta de nuevo';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * REGISTRO de nuevo usuario
 * Incluye: validación de contraseña fuerte, sanitización, verificación de email
 */
export const register = async (email, password, displayName) => {
  try {
    // 1. Validar y sanitizar todos los inputs
    const validation = validateRegisterInput(email, password, displayName);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors[0],
        allErrors: validation.errors
      };
    }

    secureLog('Registrando nuevo usuario...');

    // 2. Crear usuario con Firebase
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      validation.sanitizedEmail,
      password
    );
    const user = userCredential.user;

    // 3. Actualizar perfil con nombre sanitizado
    if (validation.sanitizedName) {
      await updateProfile(user, { displayName: validation.sanitizedName });
    }

    // 4. Enviar email de verificación
    try {
      await sendEmailVerification(user, {
        url: window.location.origin, // URL de redirección después de verificar
        handleCodeInApp: false
      });
      secureLog('Email de verificación enviado');
    } catch (verificationError) {
      secureLog('Error al enviar verificación');
      // No bloqueamos el registro si falla el envío del email
    }

    secureLog('Registro completado');

    return {
      success: true,
      requiresVerification: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: validation.sanitizedName || user.email,
        emailVerified: false
      }
    };
  } catch (error) {
    secureLog('Error en registro');

    let errorMessage = 'Error al crear la cuenta';

    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Este email ya tiene una cuenta registrada';
        break;
      case 'auth/invalid-email':
        errorMessage = 'El formato del email no es válido';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña no cumple los requisitos de seguridad';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'El registro está temporalmente deshabilitado';
        break;
      default:
        errorMessage = 'Error al crear la cuenta. Intenta de nuevo';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * REENVIAR email de verificación
 */
export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No hay usuario autenticado' };
    }

    if (user.emailVerified) {
      return { success: false, error: 'El email ya está verificado' };
    }

    await sendEmailVerification(user);
    return { success: true, message: 'Email de verificación enviado' };
  } catch (error) {
    if (error.code === 'auth/too-many-requests') {
      return { success: false, error: 'Demasiados intentos. Espera unos minutos.' };
    }
    return { success: false, error: 'Error al enviar email de verificación' };
  }
};

/**
 * VERIFICAR si el email del usuario actual está verificado
 */
export const checkEmailVerified = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { verified: false, error: 'No hay usuario autenticado' };
    }

    // Recargar datos del usuario para obtener estado actualizado
    await reload(user);

    return {
      verified: user.emailVerified,
      email: user.email
    };
  } catch (error) {
    return { verified: false, error: 'Error al verificar estado' };
  }
};

// ============================================
// OBSERVADOR DE ESTADO DE AUTENTICACIÓN
// ============================================

/**
 * OBSERVAR cambios en el estado de autenticación
 * CREA/ACTUALIZA usuario en Firestore automáticamente
 *
 * @param {Function} callback - Función que se ejecuta cuando cambia el estado
 * @returns {Function} - Función para cancelar la suscripción
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      secureLog('Usuario autenticado detectado');

      // Crear/actualizar usuario en Firestore con rol
      try {
        await createOrUpdateUserRole(user.uid, {
          email: user.email,
          displayName: user.displayName || user.email,
          role: ROLES.VISUALIZADOR, // Rol por defecto (solo lectura por seguridad)
          assignedPlants: []
        });
        secureLog('Usuario sincronizado en Firestore');
      } catch (error) {
        // No bloqueamos el login si falla la sincronización
        secureLog('Error al sincronizar usuario');
      }

      callback({
        isAuthenticated: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          isAnonymous: user.isAnonymous
        }
      });
    } else {
      secureLog('Sesión no activa');

      callback({
        isAuthenticated: false,
        user: null
      });
    }
  });
};

// ============================================
// AUTENTICACIÓN ANÓNIMA (OPCIONAL)
// ============================================

/**
 * LOGIN ANÓNIMO (para testing o apps sin usuarios)
 * NOTA: Requiere habilitar Anonymous Auth en Firebase Console
 */
export const loginAnonymously = async () => {
  try {
    secureLog('Iniciando sesión anónima...');

    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    secureLog('Sesión anónima iniciada');

    return {
      success: true,
      user: {
        uid: user.uid,
        email: null,
        displayName: 'Usuario Anónimo',
        isAnonymous: true
      }
    };
  } catch (error) {
    secureLog('Error en sesión anónima');

    return {
      success: false,
      error: 'No se pudo iniciar sesión anónima'
    };
  }
};

// ============================================
// LOGOUT
// ============================================

/**
 * LOGOUT - Cerrar sesión
 */
export const logout = async () => {
  try {
    secureLog('Cerrando sesión...');

    await signOut(auth);

    secureLog('Sesión cerrada');

    return { success: true };
  } catch (error) {
    secureLog('Error al cerrar sesión');

    return {
      success: false,
      error: 'Error al cerrar sesión'
    };
  }
};

// ============================================
// RECUPERAR CONTRASEÑA
// ============================================

/**
 * ENVIAR EMAIL para recuperar contraseña
 * Incluye: rate limiting, sanitización
 */
export const resetPassword = async (email) => {
  try {
    // 1. Validar y sanitizar email
    const emailResult = sanitizeEmail(email);
    if (!emailResult.isValid) {
      return {
        success: false,
        error: emailResult.error
      };
    }

    // 2. Rate limiting para prevenir enumeración de usuarios
    const rateLimit = checkRateLimit(`reset_${emailResult.sanitized}`);
    if (rateLimit.isBlocked) {
      return {
        success: false,
        error: 'Demasiados intentos. Espera unos minutos.'
      };
    }

    secureLog('Enviando email de recuperación...');

    await sendPasswordResetEmail(auth, emailResult.sanitized);

    // Registrar intento (exitoso o no, mismo mensaje por seguridad)
    recordLoginAttempt(`reset_${emailResult.sanitized}`, false);

    secureLog('Proceso de recuperación completado');

    // Siempre devolver éxito para no revelar si el email existe
    return {
      success: true,
      message: 'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña.'
    };
  } catch (error) {
    secureLog('Error en recuperación de contraseña');

    // Siempre devolver mensaje genérico por seguridad
    return {
      success: true, // Retornamos true para no revelar si el email existe
      message: 'Si el email está registrado, recibirás instrucciones para recuperar tu contraseña.'
    };
  }
};

// ============================================
// UTILIDADES
// ============================================

/**
 * ✅ VERIFICAR si hay usuario autenticado
 */
export const getCurrentUser = () => {
  const user = auth.currentUser;
  
  if (user) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email,
      isAnonymous: user.isAnonymous
    };
  }
  
  return null;
};

/**
 * ACTUALIZAR perfil del usuario
 * Incluye: sanitización del nombre
 */
export const updateUserProfile = async (displayName) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      return {
        success: false,
        error: 'No hay usuario autenticado'
      };
    }

    // Importar sanitizeName dinámicamente para evitar dependencia circular
    const { sanitizeName } = await import('../security/securityService');
    const nameResult = sanitizeName(displayName);

    if (!nameResult.isValid) {
      return {
        success: false,
        error: nameResult.error
      };
    }

    await updateProfile(user, { displayName: nameResult.sanitized });

    secureLog('Perfil actualizado');

    return {
      success: true
    };
  } catch (error) {
    secureLog('Error al actualizar perfil');

    return {
      success: false,
      error: 'Error al actualizar el perfil'
    };
  }
};

// ============================================
// EXPORTAR AUTH para uso directo si es necesario
// ============================================

export { auth };

// ============================================
// NOTAS - SEGURIDAD v3.0
// ============================================

/*
FUNCIONES DISPONIBLES:
- login(email, password) - Con rate limiting y sanitización
- register(email, password, displayName) - Con validación de contraseña fuerte
- loginAnonymously() - Requiere habilitar Anonymous Auth en Firebase
- logout()
- resetPassword(email) - Con protección contra enumeración de usuarios
- onAuthChange(callback) - Crea usuario en Firestore automáticamente
- getCurrentUser()
- updateUserProfile(displayName) - Con sanitización

SEGURIDAD IMPLEMENTADA:
- Rate limiting: 5 intentos por 5 minutos, bloqueo de 15 minutos
- Sanitización de todos los inputs (email, nombre)
- Validación de contraseña fuerte (8+ chars, mayúscula, minúscula, número, especial)
- Mensajes de error genéricos (no revelan si el email existe)
- Sin logs de información sensible en producción
- Protección contra enumeración de usuarios en recuperación de contraseña

INTEGRACIÓN CON ROLES:
- onAuthChange() crea/actualiza automáticamente el usuario en Firestore
- Asigna rol VISUALIZADOR por defecto (solo lectura, máxima seguridad)
- Los administradores pueden cambiar roles después
*/