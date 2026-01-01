import React, { useState, useEffect } from 'react';
import { 
  migrateEquipmentsToAuditFields, 
  checkMigrationStatus 
} from '../../migrateEquipmentsToAuditFields';
import { Loader, CheckCircle, AlertCircle, Info } from 'lucide-react';

const MigrationRunner = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [initialStatus, setInitialStatus] = useState(null);

  // Al cargar, verificar estado inicial
  useEffect(() => {
    const checkInitial = async () => {
      const initial = await checkMigrationStatus();
      setInitialStatus(initial);
    };
    checkInitial();
  }, []);

  const runMigration = async () => {
    // Confirmación con información
    const confirmText = initialStatus 
      ? `Se migrarán ${initialStatus.withoutAuditFields + initialStatus.partialAuditFields} equipos.\n\n¿Continuar?`
      : '¿Ejecutar migración?';
    
    if (!window.confirm(confirmText)) return;

    setLoading(true);
    setStatus('🔄 Iniciando migración...');
    setResult(null);
    
    try {
      // Ejecutar migración
      const migrationResult = await migrateEquipmentsToAuditFields();
      
      if (migrationResult.success) {
        setStatus('✅ Migración completada exitosamente');
        setResult(migrationResult);
        
        // Verificar resultado final
        const finalStatus = await checkMigrationStatus();
        setInitialStatus(finalStatus);
      } else {
        setStatus('❌ Error en la migración');
        setResult(migrationResult);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    setLoading(true);
    setStatus('🔍 Verificando estado...');
    
    try {
      const statusResult = await checkMigrationStatus();
      setStatus('📊 Estado verificado');
      setResult(statusResult);
      setInitialStatus(statusResult);
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            🔄 Migración de Campos de Auditoría
          </h1>
          <p className="text-gray-600 text-sm">
            Este proceso agregará los campos de auditoría a todos los equipos existentes en Firebase.
          </p>
        </div>

        {/* Estado Inicial */}
        {initialStatus && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Estado Actual
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total de Equipos</p>
                <p className="text-3xl font-bold text-blue-600">{initialStatus.total}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Ya Migrados</p>
                <p className="text-3xl font-bold text-green-600">{initialStatus.withAuditFields}</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Necesitan Migración</p>
                <p className="text-3xl font-bold text-orange-600">
                  {initialStatus.withoutAuditFields + initialStatus.partialAuditFields}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Progreso</p>
                <p className="text-3xl font-bold text-purple-600">{initialStatus.percentage}%</p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${initialStatus.percentage}%` }}
                />
              </div>
            </div>

            {/* Advertencias */}
            {initialStatus.percentage === 100 ? (
              <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <p className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  ✅ Todos los equipos ya tienen campos de auditoría
                </p>
              </div>
            ) : (
              <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                <p className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  ⚠️ Hay equipos que necesitan migración
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={checkStatus} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Info className="w-5 h-5" />
              )}
              Verificar Estado
            </button>
            
            <button 
              onClick={runMigration} 
              disabled={loading || (initialStatus && initialStatus.percentage === 100)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              Ejecutar Migración
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              💡 Consejo: Verifica el estado antes de ejecutar la migración
            </p>
          </div>
        </div>

        {/* Resultado */}
        {status && (
          <div className={`rounded-lg shadow-lg p-6 mb-6 ${
            status.includes('❌') ? 'bg-red-50 border-2 border-red-200' : 
            status.includes('✅') ? 'bg-green-50 border-2 border-green-200' : 
            'bg-blue-50 border-2 border-blue-200'
          }`}>
            <p className="font-bold text-lg mb-2">{status}</p>
            
            {result && (
              <div className="mt-4 bg-white rounded p-4">
                <h3 className="font-semibold mb-2">Detalles:</h3>
                {result.success ? (
                  <div className="space-y-2 text-sm">
                    {result.migrated !== undefined && (
                      <>
                        <p>✅ <strong>Equipos migrados:</strong> {result.migrated}</p>
                        <p>📊 <strong>Total de equipos:</strong> {result.totalEquipment}</p>
                        {result.batches && <p>📦 <strong>Batches procesados:</strong> {result.batches}</p>}
                      </>
                    )}
                    {result.percentage !== undefined && (
                      <>
                        <p>📊 <strong>Total de equipos:</strong> {result.total}</p>
                        <p>✅ <strong>Con campos completos:</strong> {result.withAuditFields}</p>
                        <p>⚠️ <strong>Con campos parciales:</strong> {result.partialAuditFields}</p>
                        <p>❌ <strong>Sin campos:</strong> {result.withoutAuditFields}</p>
                        <p>📈 <strong>Progreso:</strong> {result.percentage}%</p>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-red-600">❌ Error: {result.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">📝 Instrucciones:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Haz clic en <strong>"Verificar Estado"</strong> para ver cuántos equipos necesitan migración</li>
            <li>Si hay equipos pendientes, haz clic en <strong>"Ejecutar Migración"</strong></li>
            <li>Espera a que termine (puede tomar unos segundos)</li>
            <li>Verifica que el progreso sea 100%</li>
            <li>Revisa en Firebase Console que los equipos tengan los nuevos campos</li>
            <li>Una vez completado, puedes cerrar esta pantalla</li>
          </ol>

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-xs text-yellow-800">
              ⚠️ <strong>Importante:</strong> Solo necesitas ejecutar esto UNA VEZ. Los equipos creados después de actualizar firebaseServices.js tendrán estos campos automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationRunner;