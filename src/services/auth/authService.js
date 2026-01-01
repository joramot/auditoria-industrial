// authService.js - Servicio de Autenticación
// Versión: 2.1 - CORREGIDO - Sin duplicados
// ✅ ARCHIVO FINAL - Errores de compilación resueltos

import { 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signInAnonymously
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { createOrUpdateUserRole, ROLES } from '../migration/roleService';


// ============================================
// AUTENTICACIÓN CON EMAIL Y CONTRASEÑA
// ============================================

/**
 * 🔐 LOGIN con email y contraseña
 */
export const login = async (email, password) => {
  try {
    console.log('🔐 Intentando login con:', email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Login exitoso:', user.email);
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      }
    };
  } catch (error) {
    console.error('❌ Error en login:', error);
    
    let errorMessage = 'Error al iniciar sesión';
    
    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = 'Email inválido';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Usuario deshabilitado';
        break;
      case 'auth/user-not-found':
        errorMessage = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Contraseña incorrecta';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Credenciales inválidas';
        break;
      default:
        errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * 👤 REGISTRO de nuevo usuario
 */
export const register = async (email, password, displayName) => {
  try {
    console.log('📝 Registrando usuario:', email);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Actualizar perfil con nombre
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    console.log('✅ Registro exitoso:', user.email);
    
    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.email,
      }
    };
  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    let errorMessage = 'Error al registrar usuario';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'El email ya está registrado';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email inválido';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña es muy débil (mínimo 6 caracteres)';
        break;
      default:
        errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// ============================================
// OBSERVADOR DE ESTADO DE AUTENTICACIÓN
// ============================================

/**
 * 👀 OBSERVAR cambios en el estado de autenticación
 * ✅ CREA/ACTUALIZA usuario en Firestore automáticamente
 * 
 * @param {Function} callback - Función que se ejecuta cuando cambia el estado
 * @returns {Function} - Función para cancelar la suscripción
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('👤 Usuario autenticado:', user.email || user.uid);
      
      // ✅ Crear/actualizar usuario en Firestore con rol
      try {
        await createOrUpdateUserRole(user.uid, {
          email: user.email,
          displayName: user.displayName || user.email,
          role: ROLES.SUPERVISOR, // Rol por defecto
          assignedPlants: []
        });
        console.log('✅ Usuario sincronizado en Firestore con rol');
      } catch (error) {
        console.error('❌ Error al sincronizar usuario en Firestore:', error);
        // No bloqueamos el login si falla la sincronización
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
      console.log('👤 No hay usuario autenticado');
      
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
 * 👻 LOGIN ANÓNIMO (para testing o apps sin usuarios)
 * ⚠️ NOTA: Requiere habilitar Anonymous Auth en Firebase Console
 */
export const loginAnonymously = async () => {
  try {
    console.log('👻 Iniciando sesión anónima...');
    
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    
    console.log('✅ Login anónimo exitoso:', user.uid);
    
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
    console.error('❌ Error en login anónimo:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// LOGOUT
// ============================================

/**
 * 🚪 LOGOUT - Cerrar sesión
 */
export const logout = async () => {
  try {
    console.log('🚪 Cerrando sesión...');
    
    await signOut(auth);
    
    console.log('✅ Sesión cerrada exitosamente');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error al cerrar sesión:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// RECUPERAR CONTRASEÑA
// ============================================

/**
 * 📧 ENVIAR EMAIL para recuperar contraseña
 */
export const resetPassword = async (email) => {
  try {
    console.log('📧 Enviando email de recuperación a:', email);
    
    await sendPasswordResetEmail(auth, email);
    
    console.log('✅ Email enviado exitosamente');
    
    return {
      success: true,
      message: 'Email de recuperación enviado. Revisa tu bandeja de entrada.'
    };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    
    let errorMessage = 'Error al enviar email de recuperación';
    
    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = 'Email inválido';
        break;
      case 'auth/user-not-found':
        errorMessage = 'Usuario no encontrado';
        break;
      default:
        errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
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
 * ✅ ACTUALIZAR perfil del usuario
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
    
    await updateProfile(user, { displayName });
    
    console.log('✅ Perfil actualizado:', displayName);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);
    
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// EXPORTAR AUTH para uso directo si es necesario
// ============================================

export { auth };

// ============================================
// 📝 NOTAS IMPORTANTES
// ============================================

/*
✅ FUNCIONES DISPONIBLES:
- login(email, password)
- register(email, password, displayName)
- loginAnonymously() - ⚠️ Requiere habilitar Anonymous Auth en Firebase
- logout()
- resetPassword(email)
- onAuthChange(callback) - ✅ Crea usuario en Firestore automáticamente
- getCurrentUser()
- updateUserProfile(displayName)

✅ INTEGRACIÓN CON ROLES:
- onAuthChange() ahora crea/actualiza automáticamente el usuario en Firestore
- Asigna rol SUPERVISOR por defecto
- Los administradores pueden cambiar roles después

❌ FUNCIONES REMOVIDAS (para evitar errores):
- loginWithGoogle() - REMOVIDA
- loginWithFacebook() - REMOVIDA

💡 Si necesitas login social (Google/Facebook):
1. Habilítalos en Firebase Console
2. Agrega los providers a firebaseConfig.js
3. Agrega las funciones de login social aquí

📚 Documentación:
https://firebase.google.com/docs/auth/web/password-auth
*/