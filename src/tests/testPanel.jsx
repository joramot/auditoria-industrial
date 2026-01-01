import React, { useState } from 'react';
import { runAllTests, testCreateUser, testPermissions, testEditableFields, testAssignRole, testPlantAccess, testRoleChecks, cleanupTestUsers } from './testRoleSystem';

/**
 * Panel de Pruebas del Sistema de Roles
 * Componente temporal para ejecutar las pruebas
 */
const TestPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const handleRunAllTests = async () => {   
    setIsRunning(true);
    setResults(null);
    
    console.clear();
    console.log('🚀 Iniciando pruebas desde la interfaz...\n');
    
    try {
      const testResults = await runAllTests();
      setResults(testResults);
    } catch (error) {
      console.error('Error ejecutando pruebas:', error);
      alert('Error al ejecutar pruebas. Revisa la consola.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleRunSingleTest = async (testFn, testName) => {
    setIsRunning(true);
    console.clear();
    console.log(`🧪 Ejecutando: ${testName}\n`);
    
    try {
      await testFn();
      alert(`✅ ${testName} completado. Revisa la consola para ver los resultados.`);
    } catch (error) {
      console.error(`Error en ${testName}:`, error);
      alert(`❌ Error en ${testName}. Revisa la consola.`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'white',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      maxWidth: '400px',
      zIndex: 9999
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>
        🧪 Panel de Pruebas
      </h3>

      {/* Botón Principal */}
      <button
        onClick={handleRunAllTests}
        disabled={isRunning}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isRunning ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: isRunning ? 'not-allowed' : 'pointer',
          marginBottom: '15px'
        }}
      >
        {isRunning ? '⏳ Ejecutando...' : '🚀 Ejecutar Todas las Pruebas'}
      </button>

      {/* Resultados */}
      {results && (
        <div style={{
          padding: '10px',
          backgroundColor: results.failed === 0 ? '#dcfce7' : '#fee2e2',
          borderRadius: '6px',
          marginBottom: '15px'
        }}>
          <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
            📊 Resultados:
          </p>
          <p style={{ margin: '5px 0' }}>✅ Pasaron: {results.passed}</p>
          <p style={{ margin: '5px 0' }}>❌ Fallaron: {results.failed}</p>
          <p style={{ margin: '5px 0' }}>
            📈 Éxito: {((results.passed / results.total) * 100).toFixed(0)}%
          </p>
        </div>
      )}

      {/* Pruebas Individuales */}
      <details style={{ marginBottom: '10px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
          🎯 Pruebas Individuales
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => handleRunSingleTest(testCreateUser, 'Crear Usuario')}
            disabled={isRunning}
            style={buttonStyle}
          >
            1️⃣ Crear Usuario
          </button>
          <button
            onClick={() => handleRunSingleTest(testPermissions, 'Verificar Permisos')}
            disabled={isRunning}
            style={buttonStyle}
          >
            2️⃣ Verificar Permisos
          </button>
          <button
            onClick={() => handleRunSingleTest(testEditableFields, 'Campos Editables')}
            disabled={isRunning}
            style={buttonStyle}
          >
            3️⃣ Campos Editables
          </button>
          <button
            onClick={() => handleRunSingleTest(testAssignRole, 'Asignar Roles')}
            disabled={isRunning}
            style={buttonStyle}
          >
            4️⃣ Asignar Roles
          </button>
          <button
            onClick={() => handleRunSingleTest(testPlantAccess, 'Acceso a Plantas')}
            disabled={isRunning}
            style={buttonStyle}
          >
            5️⃣ Acceso a Plantas
          </button>
          <button
            onClick={() => handleRunSingleTest(testRoleChecks, 'Verificaciones Rápidas')}
            disabled={isRunning}
            style={buttonStyle}
          >
            6️⃣ Verificaciones Rápidas
          </button>
        </div>
      </details>

      {/* Botón de Limpieza */}
      <button
        onClick={async () => {
          console.clear();
          await cleanupTestUsers();
          alert('🧹 Revisa la consola para ver los IDs de usuarios de prueba a eliminar.');
        }}
        disabled={isRunning}
        style={{
          ...buttonStyle,
          backgroundColor: '#ef4444',
          width: '100%'
        }}
      >
        🧹 Ver Usuarios de Prueba
      </button>

      <p style={{ 
        margin: '10px 0 0 0', 
        fontSize: '12px', 
        color: '#6b7280',
        textAlign: 'center'
      }}>
        💡 Abre la consola del navegador (F12) para ver los resultados detallados
      </p>
    </div>
  );
};

const buttonStyle = {
  padding: '8px 12px',
  backgroundColor: '#6b7280',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
  textAlign: 'left'
};

export default TestPanel;