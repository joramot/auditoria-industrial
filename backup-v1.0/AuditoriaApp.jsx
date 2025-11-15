import React, { useState, useEffect } from 'react';
import { Camera, Upload, Search, Filter, Download, Plus, ChevronRight, CheckCircle, AlertCircle, Wifi, WifiOff, Home, ClipboardList, Database, Settings, X, Save, Trash2, FileText, Loader } from 'lucide-react';
import { 
  addPlant, 
  getPlants, 
  updatePlant, 
  addEquipment, 
  getEquipmentByPlant, 
  updateEquipment,
  uploadImage,
  exportToJSON,
  exportToCSV
} from './firebaseServices';

const AuditoriaApp = () => {
  const [currentView, setCurrentView] = useState('plants');
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [searchTerm, setSearchTerm] = useState('');
  const [plants, setPlants] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [newPlantData, setNewPlantData] = useState({
    name: '',
    location: '',
    address: '',
    responsiblePerson: '',
    phoneNumber: ''
  });
  
  const [formData, setFormData] = useState({
    equipmentName: '',
    locationInPlant: '',
    serialNumber: '',
    model: '',
    manufacturer: '',
    countryOfOrigin: '',
    plateStatus: 'OK',
    plateNotes: '',
    origin: 'NACIONAL',
    actionsDescription: '',
    observations: ''
  });

  const [capturedImages, setCapturedImages] = useState({
    equipment: [],
    plate: [],
    invoice: [],
    customs: []
  });

  // Monitorear conexión
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cargar plantas al inicio
  useEffect(() => {
    loadPlants();
  }, []);

  // Auto-hide success message
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const loadPlants = async () => {
    setIsLoading(true);
    const result = await getPlants();
    if (result.success) {
      setPlants(result.data);
    } else {
      alert('❌ Error al cargar plantas: ' + result.error);
    }
    setIsLoading(false);
  };

  const loadEquipment = async (plantId) => {
    setIsLoading(true);
    const result = await getEquipmentByPlant(plantId);
    if (result.success) {
      setEquipment(result.data);
    } else {
      alert('❌ Error al cargar equipos: ' + result.error);
    }
    setIsLoading(false);
  };

  const handleSavePlant = async () => {
    if (!newPlantData.name || !newPlantData.location) {
      alert('⚠️ Por favor completa los campos obligatorios:\n- Nombre de la Planta\n- Ciudad y Estado');
      return;
    }

    setIsLoading(true);
    const result = await addPlant(newPlantData);
    
    if (result.success) {
      setSuccessMessage(`✓ Planta "${newPlantData.name}" guardada correctamente`);
      setShowSuccessMessage(true);
      
      // Recargar plantas
      await loadPlants();
      
      setTimeout(() => {
        setCurrentView('plants');
        setNewPlantData({
          name: '',
          location: '',
          address: '',
          responsiblePerson: '',
          phoneNumber: ''
        });
      }, 2000);
    } else {
      alert('❌ Error al guardar planta: ' + result.error);
    }
    setIsLoading(false);
  };

  const handleSaveEquipment = async () => {
    if (!formData.equipmentName || !formData.locationInPlant || !formData.serialNumber) {
      alert('⚠️ Por favor completa los campos obligatorios:\n- Nombre del Equipo\n- Localización en Planta\n- Número de Serie');
      return;
    }

    setIsLoading(true);
    
    const equipmentData = {
      name: formData.equipmentName,
      location: formData.locationInPlant,
      serialNumber: formData.serialNumber,
      model: formData.model,
      manufacturer: formData.manufacturer,
      countryOfOrigin: formData.countryOfOrigin,
      plateStatus: formData.plateStatus,
      plateNotes: formData.plateNotes,
      origin: formData.origin,
      actionsDescription: formData.actionsDescription,
      observations: formData.observations,
      capturedBy: 'Usuario Actual'
    };

    const result = await addEquipment(selectedPlant.id, equipmentData);
    
    if (result.success) {
      setSuccessMessage(`✓ Equipo "${formData.equipmentName}" guardado correctamente`);
      setShowSuccessMessage(true);
      
      // Recargar plantas y equipos
      await loadPlants();
      await loadEquipment(selectedPlant.id);
      
      setTimeout(() => {
        setCurrentView('equipment');
        setFormData({
          equipmentName: '',
          locationInPlant: '',
          serialNumber: '',
          model: '',
          manufacturer: '',
          countryOfOrigin: '',
          plateStatus: 'OK',
          plateNotes: '',
          origin: 'NACIONAL',
          actionsDescription: '',
          observations: ''
        });
        setCapturedImages({
          equipment: [],
          plate: [],
          invoice: [],
          customs: []
        });
      }, 2000);
    } else {
      alert('❌ Error al guardar equipo: ' + result.error);
    }
    setIsLoading(false);
  };

  const handleImageCapture = async (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        alert(`📸 Imagen capturada: ${file.name}\n\nEn la versión completa, esto subirá la imagen a Firebase Storage y la comprimirá automáticamente.`);
        
        // Para la implementación real, descomentar:
        /*
        setIsLoading(true);
        const equipmentId = selectedEquipment?.id || 'temp_' + Date.now();
        const result = await uploadImage(file, type, equipmentId);
        if (result.success) {
          alert('✅ Imagen subida correctamente');
        } else {
          alert('❌ Error al subir imagen: ' + result.error);
        }
        setIsLoading(false);
        */
      }
    };
    
    input.click();
  };

  const handleExport = async (format) => {
    setIsLoading(true);
    
    if (format === 'json') {
      const result = await exportToJSON();
      if (result.success) {
        alert('✅ Datos exportados a JSON correctamente');
      } else {
        alert('❌ Error al exportar: ' + result.error);
      }
    } else if (format === 'excel' || format === 'csv') {
      const result = await exportToCSV();
      if (result.success) {
        alert('✅ Datos exportados a CSV/Excel correctamente');
      } else {
        alert('❌ Error al exportar: ' + result.error);
      }
    } else {
      alert(`📥 Exportación en formato ${format.toUpperCase()} en desarrollo`);
    }
    
    setIsLoading(false);
  };

  const filteredPlants = plants.filter(plant =>
    plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plant.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderHeader = () => (
    <div className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6" />
          <h1 className="text-xl font-bold">Auditoría Industrial</h1>
        </div>
        <div className="flex items-center gap-3">
          {isOffline ? (
            <div className="flex items-center gap-1 bg-red-500 px-2 py-1 rounded text-xs">
              <WifiOff className="w-4 h-4" />
              <span>Offline</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-green-500 px-2 py-1 rounded text-xs">
              <Wifi className="w-4 h-4" />
              <span>Online</span>
            </div>
          )}
          {isLoading && <Loader className="w-5 h-5 animate-spin" />}
        </div>
      </div>
      
      {currentView === 'equipment' && selectedPlant && (
        <div className="text-sm opacity-90 flex items-center gap-2">
          <button onClick={() => setCurrentView('plants')} className="hover:underline">
            Plantas
          </button>
          <ChevronRight className="w-4 h-4" />
          <span>{selectedPlant.name}</span>
        </div>
      )}
      
      {currentView === 'newPlant' && (
        <div className="text-sm opacity-90 flex items-center gap-2">
          <button onClick={() => setCurrentView('plants')} className="hover:underline">
            Plantas
          </button>
          <ChevronRight className="w-4 h-4" />
          <span>Nueva Planta</span>
        </div>
      )}
      
      {currentView === 'form' && (
        <div className="text-sm opacity-90 flex items-center gap-2">
          <button onClick={() => setCurrentView('plants')} className="hover:underline">
            Plantas
          </button>
          <ChevronRight className="w-4 h-4" />
          <button onClick={() => setCurrentView('equipment')} className="hover:underline">
            {selectedPlant?.name}
          </button>
          <ChevronRight className="w-4 h-4" />
          <span>Captura de Equipo</span>
        </div>
      )}
    </div>
  );

  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
      <div className="flex justify-around p-2">
        <button
          onClick={() => setCurrentView('plants')}
          className={`flex flex-col items-center p-2 rounded transition-colors ${
            currentView === 'plants' || currentView === 'equipment' || currentView === 'form' || currentView === 'newPlant'
              ? 'text-blue-600' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Plantas</span>
        </button>
        <button
          onClick={() => setCurrentView('reports')}
          className={`flex flex-col items-center p-2 rounded transition-colors ${
            currentView === 'reports' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ClipboardList className="w-6 h-6" />
          <span className="text-xs mt-1">Reportes</span>
        </button>
        <button
          onClick={() => alert('🔍 Panel de filtros avanzados en desarrollo')}
          className="flex flex-col items-center p-2 rounded text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Filter className="w-6 h-6" />
          <span className="text-xs mt-1">Filtros</span>
        </button>
      </div>
    </div>
  );

  const renderPlantsList = () => (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar plantas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setCurrentView('newPlant')}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 px-4 shadow-md"
        >
          <Plus className="w-6 h-6" />
          <span className="text-sm font-medium">Planta</span>
        </button>
      </div>

      {showSuccessMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlants.map(plant => (
            <div
              key={plant.id}
              onClick={() => {
                setSelectedPlant(plant);
                loadEquipment(plant.id);
                setCurrentView('equipment');
              }}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{plant.name}</h3>
                  <p className="text-sm text-gray-600">{plant.location}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">{plant.equipmentCount || 0} equipos</span>
                </div>
                <span className="text-xs text-gray-500">Última auditoría: {plant.lastAudit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredPlants.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron plantas</p>
          <button
            onClick={() => setCurrentView('newPlant')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar primera planta
          </button>
        </div>
      )}
    </div>
  );

  const renderNewPlantForm = () => (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Nueva Planta Industrial</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Planta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newPlantData.name}
              onChange={(e) => setNewPlantData({...newPlantData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Planta Norte"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad y Estado <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newPlantData.location}
              onChange={(e) => setNewPlantData({...newPlantData, location: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Monterrey, NL"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Completa</label>
            <textarea
              value={newPlantData.address}
              onChange={(e) => setNewPlantData({...newPlantData, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
              placeholder="Calle, número, colonia, código postal"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsable de Planta</label>
            <input
              type="text"
              value={newPlantData.responsiblePerson}
              onChange={(e) => setNewPlantData({...newPlantData, responsiblePerson: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre del responsable"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto</label>
            <input
              type="tel"
              value={newPlantData.phoneNumber}
              onChange={(e) => setNewPlantData({...newPlantData, phoneNumber: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="(999) 999-9999"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button 
          onClick={handleSavePlant}
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
        >
          {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isLoading ? 'Guardando...' : 'Guardar Planta'}
        </button>
        <button 
          onClick={() => {
            setCurrentView('plants');
            setNewPlantData({
              name: '',
              location: '',
              address: '',
              responsiblePerson: '',
              phoneNumber: ''
            });
          }}
          disabled={isLoading}
          className="px-6 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors shadow-md disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <span className="font-medium">ℹ️ Información:</span> Los campos marcados con <span className="text-red-500">*</span> son obligatorios
      </div>
    </div>
  );

  const renderEquipmentList = () => (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="font-bold text-lg text-gray-800">{selectedPlant?.name}</h2>
        <p className="text-sm text-gray-600">{selectedPlant?.location}</p>
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-4 text-sm">
          <span className="text-gray-700">
            <strong>{equipment.length}</strong> equipos
          </span>
          {selectedPlant?.responsiblePerson && (
            <span className="text-gray-600">
              Responsable: {selectedPlant.responsiblePerson}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar equipos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setCurrentView('form')}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          title="Agregar nuevo equipo"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {showSuccessMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {equipment.length > 0 ? equipment.map(equip => (
            <div
              key={equip.id}
              onClick={() => {
                setSelectedEquipment(equip);
                setFormData({
                  equipmentName: equip.name,
                  locationInPlant: equip.location,
                  serialNumber: equip.serialNumber,
                  model: equip.model || '',
                  manufacturer: equip.manufacturer || '',
                  countryOfOrigin: equip.countryOfOrigin || '',
                  plateStatus: equip.plateStatus,
                  plateNotes: equip.plateNotes || '',
                  origin: equip.origin,
                  actionsDescription: equip.actionsDescription || '',
                  observations: equip.observations || ''
                });
                setCurrentView('form');
              }}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{equip.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{equip.location}</p>
                  <p className="text-xs text-gray-500 mt-1">S/N: {equip.serialNumber}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {equip.status === 'complete' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  )}
                  {equip.syncStatus === 'synced' ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Sincronizado</span>
                  ) : (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Pendiente</span>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No hay equipos registrados en esta planta</p>
              <button
                onClick={() => setCurrentView('form')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Agregar primer equipo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {selectedEquipment ? 'Editar Equipo' : 'Nuevo Equipo'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Equipo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.equipmentName}
              onChange={(e) => setFormData({...formData, equipmentName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Compresor Atlas Copco GA55"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localización en Planta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.locationInPlant}
              onChange={(e) => setFormData({...formData, locationInPlant: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Área de Producción A"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes del Equipo</label>
            <div className="flex gap-2">
              <button 
                onClick={() => handleImageCapture('equipment')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                disabled={isLoading}
              >
                <Camera className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Cámara</span>
              </button>
              <button 
                onClick={() => handleImageCapture('equipment')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                disabled={isLoading}
              >
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Galería</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imágenes de la Placa</label>
            <div className="flex gap-2">
              <button 
                onClick={() => handleImageCapture('plate')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                disabled={isLoading}
              >
                <Camera className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Cámara</span>
              </button>
              <button 
                onClick={() => handleImageCapture('plate')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                disabled={isLoading}
              >
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Galería</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="text-md font-bold text-gray-800 mb-4">Datos Técnicos</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Serie <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: AC-2023-001"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: GA55"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fabricante</label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Atlas Copco"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País de Origen</label>
            <input
              type="text"
              value={formData.countryOfOrigin}
              onChange={(e) => setFormData({...formData, countryOfOrigin: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Alemania"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status de la Placa</label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setFormData({...formData, plateStatus: 'OK'})}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  formData.plateStatus === 'OK'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                disabled={isLoading}
              >
                OK
              </button>
              <button
                onClick={() => setFormData({...formData, plateStatus: 'OBSERVACIONES'})}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  formData.plateStatus === 'OBSERVACIONES'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                disabled={isLoading}
              >
                Observaciones
              </button>
            </div>
            {formData.plateStatus === 'OBSERVACIONES' && (
              <textarea
                value={formData.plateNotes}
                onChange={(e) => setFormData({...formData, plateNotes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Describe las observaciones de la placa..."
                disabled={isLoading}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Origen del Equipo</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormData({...formData, origin: 'NACIONAL'})}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  formData.origin === 'NACIONAL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                disabled={isLoading}
              >
                Nacional
              </button>
              <button
                onClick={() => setFormData({...formData, origin: 'EXTRANJERO'})}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  formData.origin === 'EXTRANJERO'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                disabled={isLoading}
              >
                Extranjero
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="text-md font-bold text-gray-800 mb-4">Documentación</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Factura de Compra</label>
            <div className="flex gap-2">
              <button 
                onClick={() => handleImageCapture('invoice')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                disabled={isLoading}
              >
                <Camera className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Cámara</span>
              </button>
              <button 
                onClick={() => handleImageCapture('invoice')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                disabled={isLoading}
              >
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Galería</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pedimento Aduanal</label>
            <div className="flex gap-2">
              <button 
                onClick={() => handleImageCapture('customs')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                disabled={isLoading}
              >
                <Camera className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Cámara</span>
              </button>
              <button 
                onClick={() => handleImageCapture('customs')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                disabled={isLoading}
              >
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600">Galería</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de Acciones a Realizar</label>
            <textarea
              value={formData.actionsDescription}
              onChange={(e) => setFormData({...formData, actionsDescription: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Describe las acciones necesarias (mantenimiento, reparación, etc.)"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones Generales</label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({...formData, observations: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Observaciones detalladas sobre el equipo..."
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button 
          onClick={handleSaveEquipment}
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
        >
          {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isLoading ? 'Guardando...' : 'Guardar Equipo'}
        </button>
        <button 
          onClick={() => setCurrentView('equipment')}
          disabled={isLoading}
          className="px-6 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors shadow-md disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>💾 Los datos se guardan automáticamente en Firebase</span>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Reportes y Exportación</h2>
      
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3">Filtros de Búsqueda</h3>
        <div className="space-y-3">
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Todas las plantas</option>
            {plants.map(plant => (
              <option key={plant.id}>{plant.name}</option>
            ))}
          </select>
          
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Todos los orígenes</option>
            <option>Nacional</option>
            <option>Extranjero</option>
          </select>
          
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Todos los estados</option>
            <option>Completos</option>
            <option>Incompletos</option>
          </select>

          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Estado de sincronización</option>
            <option>Sincronizados</option>
            <option>Pendientes</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3">Exportar Datos</h3>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handleExport('excel')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            <span className="font-medium">Excel</span>
          </button>
          <button 
            onClick={() => handleExport('pdf')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            <span className="font-medium">PDF</span>
          </button>
          <button 
            onClick={() => handleExport('json')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            <span className="font-medium">JSON</span>
          </button>
          <button 
            onClick={() => handleExport('txt')}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            <span className="font-medium">TXT</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3">Estadísticas Generales</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Total de plantas:</span>
            <span className="font-semibold text-blue-600">{plants.length}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Total de equipos:</span>
            <span className="font-semibold text-blue-600">
              {plants.reduce((sum, plant) => sum + (plant.equipmentCount || 0), 0)}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Última sincronización:</span>
            <span className="font-semibold text-green-600">
              {isOffline ? 'Modo Offline' : 'Sincronizado'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Tip: Exportación de Datos</p>
            <p>Los reportes se generan desde Firebase e incluyen toda la información capturada en tiempo real.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen">
      {renderHeader()}
      
      {currentView === 'plants' && renderPlantsList()}
      {currentView === 'newPlant' && renderNewPlantForm()}
      {currentView === 'equipment' && renderEquipmentList()}
      {currentView === 'form' && renderForm()}
      {currentView === 'reports' && renderReports()}
      
      {renderBottomNav()}
    </div>
  );
};

export default AuditoriaApp;