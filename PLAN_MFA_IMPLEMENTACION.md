# Plan de Implementación: Multi-Factor Authentication (MFA)

## Auditoría Industrial v2.0 - Plan de Seguridad Avanzada

**Fecha de creación:** Enero 2026
**Estado:** Pendiente de implementación
**Prioridad:** Alta

---

## 1. Resumen Ejecutivo

Este documento detalla el plan para implementar autenticación de múltiples factores (MFA) en la aplicación de Auditoría Industrial, utilizando Firebase Authentication con soporte para TOTP (Time-based One-Time Password).

### Método seleccionado: TOTP (Recomendado)
- Compatible con Google Authenticator, Authy, Microsoft Authenticator
- No depende de servicio de SMS (más confiable)
- Sin costo adicional por mensaje
- Funciona offline una vez configurado

---

## 2. Requisitos Previos

### 2.1 Firebase Console

1. **Actualizar a Plan Blaze** (pago por uso)
   - MFA requiere plan de pago
   - Costo aproximado: $0.01-0.06 USD por verificación SMS (si se usa)
   - TOTP no tiene costo adicional

2. **Habilitar MFA en Firebase Console:**
   ```
   Firebase Console → Authentication → Sign-in method →
   Multi-factor Authentication → Enable
   ```

3. **Habilitar proveedores de segundo factor:**
   - TOTP (Time-based One-Time Password) ✓
   - SMS (opcional, tiene costo)

### 2.2 Dependencias npm

```bash
# Ya incluido en firebase ^12.5
npm install firebase@latest

# Librería para generar QR codes (enrollment TOTP)
npm install qrcode.react

# Opcional: para validación de códigos TOTP en frontend
npm install otplib
```

### 2.3 Versión mínima de Firebase
- Firebase JS SDK: 9.0.0 o superior (actual: 12.5) ✓

---

## 3. Arquitectura de la Solución

### 3.1 Flujo de Autenticación con MFA

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE LOGIN CON MFA                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Usuario              App                    Firebase           │
│     │                  │                        │               │
│     │─── Email/Pass ──▶│                        │               │
│     │                  │─── signInWithEmail ───▶│               │
│     │                  │                        │               │
│     │                  │◀── MFA Required ───────│               │
│     │                  │    (error code)        │               │
│     │                  │                        │               │
│     │◀── Solicitar ────│                        │               │
│     │    código TOTP   │                        │               │
│     │                  │                        │               │
│     │─── Código ──────▶│                        │               │
│     │    (6 dígitos)   │─── verifyTOTP ────────▶│               │
│     │                  │                        │               │
│     │                  │◀── Auth Success ───────│               │
│     │◀── Dashboard ────│                        │               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Flujo de Enrollment (Configuración inicial)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE ENROLLMENT MFA                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Usuario              App                    Firebase           │
│     │                  │                        │               │
│     │─── Configurar ──▶│                        │               │
│     │    MFA           │                        │               │
│     │                  │─── generateSecret ────▶│               │
│     │                  │                        │               │
│     │                  │◀── TOTP Secret ────────│               │
│     │                  │    + QR Code URI       │               │
│     │                  │                        │               │
│     │◀── Mostrar QR ───│                        │               │
│     │                  │                        │               │
│     │─── Escanear QR ──│  (Google Authenticator)│               │
│     │                  │                        │               │
│     │─── Código ──────▶│                        │               │
│     │    verificación  │─── finalizeMFA ───────▶│               │
│     │                  │                        │               │
│     │                  │◀── MFA Enrolled ───────│               │
│     │◀── Confirmación ─│                        │               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Estructura de Archivos

### 4.1 Archivos Nuevos a Crear

```
src/
├── services/
│   └── auth/
│       └── mfaService.js          # Servicio principal de MFA
│
├── components/
│   └── auth/
│       ├── MFAEnrollment.jsx      # Pantalla de configuración MFA
│       ├── MFAVerification.jsx    # Pantalla de verificación (login)
│       ├── MFASettings.jsx        # Gestión de MFA en perfil
│       └── TOTPQRCode.jsx         # Componente de código QR
│
├── hooks/
│   └── useMFA.js                  # Hook para estado de MFA
│
└── context/
    └── MFAContext.jsx             # Contexto global de MFA (opcional)
```

### 4.2 Archivos Existentes a Modificar

| Archivo | Cambios Requeridos |
|---------|-------------------|
| `src/services/auth/authService.js` | Agregar manejo de error MFA, integrar mfaService |
| `src/hooks/useAuth.js` | Agregar estado `mfaRequired`, `mfaEnrolled` |
| `src/components/auth/LoginScreen.jsx` | Integrar flujo de verificación MFA |
| `src/services/migration/roleService.js` | Agregar campo `mfaEnabled` al usuario |
| `firestore.rules` | Agregar reglas para campos MFA |

---

## 5. Implementación Detallada

### 5.1 Servicio MFA (`src/services/auth/mfaService.js`)

```javascript
// mfaService.js - Servicio de Multi-Factor Authentication
// Versión: 1.0

import {
  multiFactor,
  TotpMultiFactorGenerator,
  TotpSecret,
  getMultiFactorResolver
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// ============================================
// CONFIGURACIÓN
// ============================================

const MFA_CONFIG = {
  APP_NAME: 'Auditoría Industrial',
  ISSUER: 'AuditoriaIndustrial'
};

// ============================================
// ENROLLMENT (CONFIGURACIÓN INICIAL)
// ============================================

/**
 * Genera el secreto TOTP para enrollment
 * @returns {Promise<Object>} { success, secret, qrCodeUrl, error }
 */
export const generateTOTPSecret = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No hay usuario autenticado' };
    }

    // Obtener sesión MFA
    const multiFactorSession = await multiFactor(user).getSession();

    // Generar secreto TOTP
    const totpSecret = await TotpMultiFactorGenerator.generateSecret(
      multiFactorSession
    );

    // Generar URI para el código QR
    const qrCodeUrl = totpSecret.generateQrCodeUrl(
      user.email,
      MFA_CONFIG.ISSUER
    );

    return {
      success: true,
      secret: totpSecret,
      secretKey: totpSecret.secretKey, // Para mostrar manualmente
      qrCodeUrl,
      error: null
    };
  } catch (error) {
    console.error('Error generando secreto TOTP:', error);
    return {
      success: false,
      error: 'Error al generar configuración MFA'
    };
  }
};

/**
 * Finaliza el enrollment verificando el código TOTP
 * @param {TotpSecret} totpSecret - Secreto generado previamente
 * @param {string} verificationCode - Código de 6 dígitos del authenticator
 * @param {string} displayName - Nombre para identificar el dispositivo
 * @returns {Promise<Object>} { success, error }
 */
export const finalizeTOTPEnrollment = async (totpSecret, verificationCode, displayName = 'Authenticator') => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No hay usuario autenticado' };
    }

    // Crear la aserción TOTP
    const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
      totpSecret,
      verificationCode
    );

    // Registrar el segundo factor
    await multiFactor(user).enroll(multiFactorAssertion, displayName);

    // Actualizar estado en Firestore
    await updateUserMFAStatus(user.uid, true);

    return {
      success: true,
      message: 'MFA configurado correctamente'
    };
  } catch (error) {
    console.error('Error finalizando enrollment:', error);

    let errorMessage = 'Error al verificar código';
    if (error.code === 'auth/invalid-verification-code') {
      errorMessage = 'Código incorrecto. Verifica e intenta de nuevo.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

// ============================================
// VERIFICACIÓN (DURANTE LOGIN)
// ============================================

/**
 * Verifica el código TOTP durante el login
 * @param {MultiFactorResolver} resolver - Resolver del error MFA
 * @param {string} verificationCode - Código de 6 dígitos
 * @returns {Promise<Object>} { success, user, error }
 */
export const verifyTOTPCode = async (resolver, verificationCode) => {
  try {
    // Encontrar el hint TOTP
    const totpHint = resolver.hints.find(
      hint => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID
    );

    if (!totpHint) {
      return {
        success: false,
        error: 'No se encontró configuración TOTP'
      };
    }

    // Crear aserción de verificación
    const multiFactorAssertion = TotpMultiFactorGenerator.assertionForSignIn(
      totpHint.uid,
      verificationCode
    );

    // Completar el sign-in
    const userCredential = await resolver.resolveSignIn(multiFactorAssertion);

    return {
      success: true,
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName
      }
    };
  } catch (error) {
    console.error('Error verificando TOTP:', error);

    let errorMessage = 'Código incorrecto';
    if (error.code === 'auth/invalid-verification-code') {
      errorMessage = 'Código incorrecto o expirado. Intenta de nuevo.';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

// ============================================
// GESTIÓN DE MFA
// ============================================

/**
 * Verifica si el usuario tiene MFA habilitado
 * @returns {Promise<Object>} { enabled, factors }
 */
export const checkMFAStatus = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { enabled: false, factors: [] };
    }

    const enrolledFactors = multiFactor(user).enrolledFactors;

    return {
      enabled: enrolledFactors.length > 0,
      factors: enrolledFactors.map(factor => ({
        uid: factor.uid,
        displayName: factor.displayName,
        factorId: factor.factorId,
        enrollmentTime: factor.enrollmentTime
      }))
    };
  } catch (error) {
    console.error('Error verificando estado MFA:', error);
    return { enabled: false, factors: [] };
  }
};

/**
 * Deshabilita MFA para el usuario actual
 * @param {string} factorUid - UID del factor a eliminar
 * @returns {Promise<Object>} { success, error }
 */
export const disableMFA = async (factorUid) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No hay usuario autenticado' };
    }

    // Encontrar el factor a eliminar
    const factorToRemove = multiFactor(user).enrolledFactors.find(
      factor => factor.uid === factorUid
    );

    if (!factorToRemove) {
      return { success: false, error: 'Factor no encontrado' };
    }

    // Eliminar el factor
    await multiFactor(user).unenroll(factorToRemove);

    // Actualizar estado en Firestore
    const remainingFactors = multiFactor(user).enrolledFactors;
    await updateUserMFAStatus(user.uid, remainingFactors.length > 0);

    return {
      success: true,
      message: 'MFA deshabilitado correctamente'
    };
  } catch (error) {
    console.error('Error deshabilitando MFA:', error);
    return {
      success: false,
      error: 'Error al deshabilitar MFA'
    };
  }
};

// ============================================
// HELPERS
// ============================================

/**
 * Actualiza el estado MFA del usuario en Firestore
 */
const updateUserMFAStatus = async (userId, mfaEnabled) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      mfaEnabled,
      mfaUpdatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error actualizando estado MFA en Firestore:', error);
  }
};

/**
 * Obtiene el resolver MFA de un error de autenticación
 * @param {Error} error - Error de Firebase Auth
 * @returns {MultiFactorResolver|null}
 */
export const getMFAResolver = (error) => {
  if (error.code === 'auth/multi-factor-auth-required') {
    return getMultiFactorResolver(auth, error);
  }
  return null;
};

/**
 * Verifica si un error requiere MFA
 * @param {Error} error - Error de Firebase Auth
 * @returns {boolean}
 */
export const isMFAError = (error) => {
  return error?.code === 'auth/multi-factor-auth-required';
};

export default {
  generateTOTPSecret,
  finalizeTOTPEnrollment,
  verifyTOTPCode,
  checkMFAStatus,
  disableMFA,
  getMFAResolver,
  isMFAError
};
```

### 5.2 Modificación de `authService.js`

Agregar al archivo existente `src/services/auth/authService.js`:

```javascript
// Agregar imports
import { isMFAError, getMFAResolver } from './mfaService';

// Modificar la función login
export const login = async (email, password) => {
  try {
    // ... código existente de validación y rate limiting ...

    const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
    const user = userCredential.user;

    recordLoginAttempt(sanitizedEmail, true);

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      }
    };
  } catch (error) {
    // NUEVO: Manejar error de MFA
    if (isMFAError(error)) {
      const resolver = getMFAResolver(error);
      return {
        success: false,
        requiresMFA: true,
        mfaResolver: resolver,
        hints: resolver.hints.map(h => ({
          factorId: h.factorId,
          displayName: h.displayName
        }))
      };
    }

    // ... resto del manejo de errores existente ...
  }
};
```

### 5.3 Componente de Verificación MFA (`MFAVerification.jsx`)

```jsx
// MFAVerification.jsx - Pantalla de verificación de código MFA
import React, { useState, useRef, useEffect } from 'react';
import { Shield, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { verifyTOTPCode } from '../../services/auth/mfaService';

const MFAVerification = ({ resolver, onSuccess, onCancel }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRefs = useRef([]);

  // Auto-focus en el primer input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Manejar cambio en cada dígito
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Solo números

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Solo un dígito
    setCode(newCode);
    setError(null);

    // Auto-avanzar al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit cuando se completan los 6 dígitos
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  // Manejar tecla backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Manejar paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
      setCode(newCode);
      if (pastedData.length === 6) {
        handleVerify(pastedData);
      }
    }
  };

  // Verificar código
  const handleVerify = async (verificationCode) => {
    setIsLoading(true);
    setError(null);

    const result = await verifyTOTPCode(resolver, verificationCode);

    if (result.success) {
      onSuccess(result.user);
    } else {
      setError(result.error);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-2xl shadow-lg text-center">
          <Shield className="w-12 h-12 mx-auto mb-3" />
          <h1 className="text-xl font-bold">Verificación de Seguridad</h1>
          <p className="text-blue-100 text-sm mt-2">
            Ingresa el código de tu aplicación authenticator
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-b-2xl shadow-lg">
          {/* Inputs de código */}
          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isLoading}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                  ${error ? 'border-red-300' : 'border-gray-300'}
                  ${isLoading ? 'bg-gray-100' : 'bg-white'}`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
              <Loader className="w-5 h-5 animate-spin" />
              <span>Verificando...</span>
            </div>
          )}

          {/* Instrucciones */}
          <div className="text-center text-sm text-gray-500 mb-6">
            <p>Abre Google Authenticator, Authy o tu app de autenticación</p>
            <p>e ingresa el código de 6 dígitos</p>
          </div>

          {/* Botón cancelar */}
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            Cancelar e intentar con otra cuenta
          </button>
        </div>
      </div>
    </div>
  );
};

export default MFAVerification;
```

### 5.4 Componente de Enrollment MFA (`MFAEnrollment.jsx`)

```jsx
// MFAEnrollment.jsx - Configuración inicial de MFA
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Smartphone, Copy, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { generateTOTPSecret, finalizeTOTPEnrollment } from '../../services/auth/mfaService';

const MFAEnrollment = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1); // 1: QR, 2: Verificar
  const [totpSecret, setTotpSecret] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Generar secreto al montar
  useEffect(() => {
    initializeEnrollment();
  }, []);

  const initializeEnrollment = async () => {
    setIsLoading(true);
    const result = await generateTOTPSecret();

    if (result.success) {
      setTotpSecret(result.secret);
      setQrCodeUrl(result.qrCodeUrl);
      setSecretKey(result.secretKey);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  // Copiar clave secreta
  const copySecretKey = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Verificar y finalizar
  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await finalizeTOTPEnrollment(
      totpSecret,
      verificationCode,
      'App Authenticator'
    );

    if (result.success) {
      onComplete();
    } else {
      setError(result.error);
      setVerificationCode('');
    }
    setIsLoading(false);
  };

  if (isLoading && !qrCodeUrl) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 text-center">
        <Shield className="w-10 h-10 mx-auto mb-2" />
        <h2 className="text-xl font-bold">Configurar Autenticación de Dos Factores</h2>
        <p className="text-blue-100 text-sm mt-1">
          Paso {step} de 2
        </p>
      </div>

      <div className="p-6">
        {step === 1 && (
          <>
            {/* Paso 1: Escanear QR */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 text-gray-700 mb-4">
                <Smartphone className="w-5 h-5" />
                <span className="font-medium">Escanea el código QR</span>
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
                <QRCodeSVG value={qrCodeUrl} size={200} />
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Usa Google Authenticator, Authy o cualquier app compatible
              </p>

              {/* Clave manual */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">
                  ¿No puedes escanear? Ingresa esta clave manualmente:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-white px-3 py-1 rounded border text-sm font-mono">
                    {secretKey}
                  </code>
                  <button
                    onClick={copySecretKey}
                    className="p-2 hover:bg-gray-200 rounded"
                    title="Copiar"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Continuar
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {/* Paso 2: Verificar código */}
            <div className="text-center mb-6">
              <p className="text-gray-700 mb-4">
                Ingresa el código de 6 dígitos de tu app authenticator
              </p>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setVerificationCode(value);
                  setError(null);
                }}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono tracking-widest py-4 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Atrás
              </button>
              <button
                onClick={handleVerify}
                disabled={isLoading || verificationCode.length !== 6}
                className={`flex-1 py-3 rounded-lg font-medium text-white
                  ${isLoading || verificationCode.length !== 6
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isLoading ? (
                  <Loader className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Verificar y Activar'
                )}
              </button>
            </div>
          </>
        )}

        {/* Cancelar */}
        <button
          onClick={onCancel}
          className="w-full mt-4 py-2 text-gray-500 text-sm hover:text-gray-700"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default MFAEnrollment;
```

### 5.5 Hook `useMFA.js`

```javascript
// useMFA.js - Hook para gestión de MFA
import { useState, useEffect, useCallback } from 'react';
import { checkMFAStatus, disableMFA } from '../services/auth/mfaService';
import { useAuth } from './useAuth';

export const useMFA = () => {
  const { user } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaFactors, setMfaFactors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar estado MFA
  const loadMFAStatus = useCallback(async () => {
    if (!user) {
      setMfaEnabled(false);
      setMfaFactors([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const status = await checkMFAStatus();
    setMfaEnabled(status.enabled);
    setMfaFactors(status.factors);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadMFAStatus();
  }, [loadMFAStatus]);

  // Deshabilitar MFA
  const removeMFA = async (factorUid) => {
    const result = await disableMFA(factorUid);
    if (result.success) {
      await loadMFAStatus();
    }
    return result;
  };

  // Refrescar estado
  const refreshMFAStatus = () => {
    loadMFAStatus();
  };

  return {
    mfaEnabled,
    mfaFactors,
    isLoading,
    removeMFA,
    refreshMFAStatus
  };
};

export default useMFA;
```

---

## 6. Modificaciones a LoginScreen.jsx

### 6.1 Cambios principales

```jsx
// Agregar imports
import MFAVerification from './MFAVerification';
import { isMFAError, getMFAResolver } from '../../services/auth/mfaService';

// Agregar estados
const [showMFAVerification, setShowMFAVerification] = useState(false);
const [mfaResolver, setMfaResolver] = useState(null);

// Modificar handleEmailLogin
const handleEmailLogin = async (e) => {
  e.preventDefault();
  // ... código existente ...

  try {
    const result = await login(email, password);

    if (result.success) {
      // Login exitoso sin MFA
      onLoginSuccess(result.user);
    } else if (result.requiresMFA) {
      // MFA requerido - mostrar pantalla de verificación
      setMfaResolver(result.mfaResolver);
      setShowMFAVerification(true);
    } else {
      setError(result.error);
    }
  } catch (err) {
    // Manejar error MFA directamente si no se capturó antes
    if (isMFAError(err)) {
      setMfaResolver(getMFAResolver(err));
      setShowMFAVerification(true);
    } else {
      setError('Error de conexión');
    }
  }
};

// Manejar éxito de MFA
const handleMFASuccess = (user) => {
  setShowMFAVerification(false);
  setMfaResolver(null);
  onLoginSuccess(user);
};

// Manejar cancelación de MFA
const handleMFACancel = () => {
  setShowMFAVerification(false);
  setMfaResolver(null);
  setPassword('');
};

// En el render, antes del return principal:
if (showMFAVerification && mfaResolver) {
  return (
    <MFAVerification
      resolver={mfaResolver}
      onSuccess={handleMFASuccess}
      onCancel={handleMFACancel}
    />
  );
}
```

---

## 7. Política de MFA por Rol

### 7.1 Configuración recomendada

| Rol | MFA Requerido | Razón |
|-----|---------------|-------|
| **Admin** | Obligatorio | Acceso total al sistema, gestión de usuarios |
| **Supervisor** | Obligatorio | Acceso a datos de campo, puede crear/editar plantas |
| **Auditor** | Recomendado | Acceso a revisión de equipos |
| **Visualizador** | Opcional | Solo lectura, riesgo bajo |

### 7.2 Implementación de política

Agregar a `roleService.js`:

```javascript
// Configuración de MFA por rol
export const MFA_POLICY = {
  [ROLES.ADMIN]: { required: true, graceLogins: 0 },
  [ROLES.SUPERVISOR]: { required: true, graceLogins: 3 },
  [ROLES.AUDITOR]: { required: false, recommended: true },
  [ROLES.VISUALIZADOR]: { required: false, recommended: false }
};

/**
 * Verifica si el usuario debe configurar MFA
 * @param {string} role - Rol del usuario
 * @param {boolean} mfaEnabled - Si tiene MFA habilitado
 * @returns {Object} { mustSetup, canSkip, message }
 */
export const checkMFARequirement = (role, mfaEnabled) => {
  const policy = MFA_POLICY[role];

  if (!policy) {
    return { mustSetup: false, canSkip: true };
  }

  if (policy.required && !mfaEnabled) {
    return {
      mustSetup: true,
      canSkip: false,
      message: 'Tu rol requiere autenticación de dos factores'
    };
  }

  if (policy.recommended && !mfaEnabled) {
    return {
      mustSetup: false,
      canSkip: true,
      message: 'Se recomienda activar autenticación de dos factores'
    };
  }

  return { mustSetup: false, canSkip: true };
};
```

---

## 8. Actualización de Firestore Rules

Agregar a `firestore.rules`:

```javascript
// Reglas para campos MFA en usuarios
match /users/{userId} {
  // Lectura: usuario puede leer sus propios datos, admin puede leer todos
  allow read: if request.auth.uid == userId || isAdmin();

  // Escritura de campos MFA: solo el propio usuario
  allow update: if request.auth.uid == userId &&
    request.resource.data.diff(resource.data).affectedKeys()
      .hasOnly(['mfaEnabled', 'mfaUpdatedAt']);

  // ... resto de reglas existentes ...
}
```

---

## 9. Checklist de Implementación

### Fase 1: Preparación
- [ ] Actualizar Firebase a plan Blaze
- [ ] Habilitar MFA en Firebase Console
- [ ] Instalar dependencia `qrcode.react`
- [ ] Crear rama de desarrollo `feature/mfa-implementation`

### Fase 2: Servicios y Hooks
- [ ] Crear `src/services/auth/mfaService.js`
- [ ] Crear `src/hooks/useMFA.js`
- [ ] Modificar `authService.js` para manejar errores MFA
- [ ] Agregar campos MFA a `roleService.js`

### Fase 3: Componentes UI
- [ ] Crear `MFAVerification.jsx`
- [ ] Crear `MFAEnrollment.jsx`
- [ ] Crear `MFASettings.jsx` (gestión en perfil)
- [ ] Modificar `LoginScreen.jsx`

### Fase 4: Integración
- [ ] Integrar flujo MFA en login
- [ ] Agregar opción de configuración MFA en perfil de usuario
- [ ] Implementar política de MFA por rol
- [ ] Actualizar `firestore.rules`

### Fase 5: Testing
- [ ] Probar enrollment completo
- [ ] Probar login con MFA
- [ ] Probar recuperación/deshabilitación de MFA
- [ ] Probar con diferentes apps authenticator
- [ ] Probar políticas por rol

### Fase 6: Documentación y Deploy
- [ ] Actualizar documentación de usuario
- [ ] Crear guía de configuración para usuarios
- [ ] Deploy a staging
- [ ] Pruebas de aceptación
- [ ] Deploy a producción

---

## 10. Consideraciones de Seguridad

### 10.1 Códigos de Recuperación
Considerar implementar códigos de recuperación de un solo uso para usuarios que pierdan acceso a su authenticator.

### 10.2 Sesiones
- Las sesiones MFA deben tener un tiempo de vida limitado
- Considerar requerir re-autenticación MFA para operaciones sensibles

### 10.3 Logging
- Registrar todos los eventos de MFA (enrollment, verificación, deshabilitación)
- No loguear códigos TOTP ni secretos

### 10.4 Rate Limiting
- Limitar intentos de verificación de código (ya implementado en Firebase)
- Considerar bloqueo temporal después de múltiples fallos

---

## 11. Estimación de Esfuerzo

| Componente | Complejidad | Archivos |
|------------|-------------|----------|
| mfaService.js | Media | 1 |
| Componentes UI | Media | 3 |
| Modificaciones existentes | Baja | 4 |
| Testing | Media | - |
| **Total** | **Media-Alta** | **8 archivos** |

---

## 12. Recursos Adicionales

- [Firebase MFA Documentation](https://firebase.google.com/docs/auth/web/multi-factor)
- [TOTP RFC 6238](https://datatracker.ietf.org/doc/html/rfc6238)
- [Google Authenticator](https://support.google.com/accounts/answer/1066447)

---

**Documento preparado para implementación futura.**
**Versión:** 1.0
**Última actualización:** Enero 2026
