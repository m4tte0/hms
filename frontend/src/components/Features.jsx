import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Save, X, FileText, Target, Wrench, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { projectsAPI } from '../services/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Features = ({ projectId }) => {
  const [project, setProject] = useState(null);
  const [features, setFeatures] = useState([]);
  const [criticalities, setCriticalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFeature, setEditingFeature] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDescrizioneGenerale, setShowDescrizioneGenerale] = useState(true);
  const [showOsservazioni, setShowOsservazioni] = useState(true);
  const [newCriticality, setNewCriticality] = useState('');
  const [editingCriticality, setEditingCriticality] = useState(null);
  const [editCriticalityText, setEditCriticalityText] = useState('');
  const [showAddCriticalityForm, setShowAddCriticalityForm] = useState(false);
  const [collapsedFeatures, setCollapsedFeatures] = useState({});

  const [formData, setFormData] = useState({
    feature_name: '',
    description: '',
    purpose: '',
    tech_specs: ''
  });

  const funzioniRef = useRef(null);
  const finalitaRef = useRef(null);
  const specificheRef = useRef(null);
  const osservazioniRef = useRef(null);
  const azioniRef = useRef(null);

  // Quill editor refs for programmatic control
  const funzioniQuillRef = useRef(null);
  const finalitaQuillRef = useRef(null);
  const specificheQuillRef = useRef(null);

  // Quill editor configuration - no toolbar
  const quillModules = {
    toolbar: false
  };

  const quillFormats = [
    'bold', 'italic', 'underline',
    'list', 'bullet'
  ];

  const applyFormat = (quillRef, format, value = true) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const range = quill.getSelection();
    if (range) {
      if (format === 'list') {
        quill.format('list', value);
      } else {
        quill.format(format, value);
      }
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadFeatures();
      loadCriticalities();
    }
  }, [projectId]);

  useEffect(() => {
    if (!project) return;
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 2000);
    return () => clearTimeout(timer);
  }, [project]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getById(projectId);
      setProject(response.data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/features/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setFeatures(data);
        // Initialize all features as collapsed
        const collapsed = {};
        data.forEach(feature => {
          collapsed[feature.id] = true;
        });
        setCollapsedFeatures(collapsed);
      }
    } catch (error) {
      console.error('Error loading features:', error);
    }
  };

  const toggleFeatureCollapse = (featureId) => {
    setCollapsedFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  const loadCriticalities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/criticalities/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setCriticalities(data);
      }
    } catch (error) {
      console.error('Error loading criticalities:', error);
    }
  };

  const handleAutoSave = async () => {
    if (!project?.id) return;
    try {
      setSaving(true);
      await projectsAPI.update(project.id, {
        funzioni_progettate: project.funzioni_progettate,
        finalita: project.finalita,
        specifiche_tecniche: project.specifiche_tecniche,
        osservazioni_note: project.osservazioni_note,
        azioni_correttive: project.azioni_correttive
      });
      setSaving(false);
    } catch (error) {
      console.error('Error saving project:', error);
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setProject(prev => ({ ...prev, [field]: value }));
  };

  const handleTextareaResize = (elementOrEvent) => {
    const element = elementOrEvent.target || elementOrEvent;
    if (element) {
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    }
  };

  const insertBullet = (field, ref) => {
    const textarea = ref.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = project[field] || '';

    // Insert bullet at cursor position
    const newValue = currentValue.substring(0, start) + '• ' + currentValue.substring(end);

    // Update the value
    handleChange(field, newValue);

    // Set cursor position after the bullet
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2);
    }, 0);
  };

  useEffect(() => {
    if (funzioniRef.current) handleTextareaResize(funzioniRef.current);
    if (finalitaRef.current) handleTextareaResize(finalitaRef.current);
    if (specificheRef.current) handleTextareaResize(specificheRef.current);
    if (osservazioniRef.current) handleTextareaResize(osservazioniRef.current);
    if (azioniRef.current) handleTextareaResize(azioniRef.current);
  }, [project?.funzioni_progettate, project?.finalita, project?.specifiche_tecniche,
      project?.osservazioni_note, project?.azioni_correttive, showDescrizioneGenerale, showOsservazioni]);

  // Criticalities functions
  const handleAddCriticality = async () => {
    if (!newCriticality.trim()) return;
    try {
      await fetch(`${API_BASE_URL}/criticalities/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criticality_text: newCriticality })
      });
      setNewCriticality('');
      setShowAddCriticalityForm(false);
      await loadCriticalities();
    } catch (error) {
      console.error('Error adding criticality:', error);
    }
  };

  const handleCancelAddCriticality = () => {
    setNewCriticality('');
    setShowAddCriticalityForm(false);
  };

  const handleEditCriticality = (criticality) => {
    setEditingCriticality(criticality.id);
    setEditCriticalityText(criticality.criticality_text);
  };

  const handleSaveCriticality = async (criticalityId) => {
    try {
      await fetch(`${API_BASE_URL}/criticalities/${projectId}/${criticalityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criticality_text: editCriticalityText })
      });
      setEditingCriticality(null);
      setEditCriticalityText('');
      await loadCriticalities();
    } catch (error) {
      console.error('Error updating criticality:', error);
    }
  };

  const handleDeleteCriticality = async (criticalityId) => {
    if (!confirm('Sei sicuro di voler eliminare questa criticità?')) return;
    try {
      await fetch(`${API_BASE_URL}/criticalities/${projectId}/${criticalityId}`, {
        method: 'DELETE'
      });
      await loadCriticalities();
    } catch (error) {
      console.error('Error deleting criticality:', error);
    }
  };

  // Features functions
  const handleAdd = () => {
    setShowAddForm(true);
    setEditingFeature(null);
    setFormData({ feature_name: '', description: '', purpose: '', tech_specs: '' });
  };

  const handleEdit = (feature) => {
    setEditingFeature(feature.id);
    setFormData({
      feature_name: feature.feature_name,
      description: feature.description,
      purpose: feature.purpose,
      tech_specs: feature.tech_specs
    });
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setEditingFeature(null);
    setShowAddForm(false);
    setFormData({ feature_name: '', description: '', purpose: '', tech_specs: '' });
  };

  const handleSaveFeature = async () => {
    if (!formData.feature_name) {
      alert('Inserisci il nome della funzionalità');
      return;
    }

    try {
      setSaving(true);
      if (editingFeature) {
        await fetch(`${API_BASE_URL}/features/${projectId}/${editingFeature}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${API_BASE_URL}/features/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      await loadFeatures();
      handleCancel();
    } catch (error) {
      console.error('Error saving feature:', error);
      alert('Errore nel salvare la funzionalità');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeature = async (featureId) => {
    if (!confirm('Sei sicuro di voler eliminare questa funzionalità?')) return;

    try {
      await fetch(`${API_BASE_URL}/features/${projectId}/${featureId}`, {
        method: 'DELETE'
      });
      await loadFeatures();
    } catch (error) {
      console.error('Error deleting feature:', error);
      alert('Errore nell\'eliminare la funzionalità');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-secondary-500">Caricamento...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-danger-600">Errore nel caricare il progetto</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Descrizione Generale Box */}
      <div className="bg-gradient-to-br from-white to-primary-50 rounded shadow-md border-2 border-primary-200 overflow-hidden">
        <div
          className="flex items-center justify-between cursor-pointer px-4 py-3 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-300 transition-colors border-b-2 border-primary-300"
          onClick={() => setShowDescrizioneGenerale(!showDescrizioneGenerale)}
        >
          <h2 className="text-base font-semibold text-secondary-900">Descrizione Generale</h2>
          {showDescrizioneGenerale ? (
            <ChevronUp className="w-5 h-5 text-secondary-700" />
          ) : (
            <ChevronDown className="w-5 h-5 text-secondary-700" />
          )}
        </div>

        {showDescrizioneGenerale && (
          <div className="p-4 space-y-4">
            <style>{`
              .quill-custom .ql-container {
                border: none !important;
                font-size: 0.875rem;
              }
              .quill-custom .ql-editor {
                min-height: 80px;
                padding: 0.375rem 0.625rem;
              }
              .quill-custom .ql-editor.ql-blank::before {
                font-style: normal;
                color: #9ca3af;
                left: 0.625rem;
              }
            `}</style>

            <div className="group/field">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-secondary-900">Funzioni Progettate e Collaudate</label>
                <div className="flex gap-1 opacity-0 group-hover/field:opacity-100 transition-opacity">
                  <button
                    onClick={() => applyFormat(funzioniQuillRef, 'bold')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Grassetto"
                  >
                    <span className="font-bold text-xs">B</span>
                  </button>
                  <button
                    onClick={() => applyFormat(funzioniQuillRef, 'italic')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Corsivo"
                  >
                    <span className="italic text-xs">I</span>
                  </button>
                  <button
                    onClick={() => applyFormat(funzioniQuillRef, 'underline')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Sottolineato"
                  >
                    <span className="underline text-xs">U</span>
                  </button>
                  <button
                    onClick={() => applyFormat(funzioniQuillRef, 'list', 'ordered')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Elenco numerato"
                  >
                    <span className="text-xs">1.</span>
                  </button>
                  <button
                    onClick={() => applyFormat(funzioniQuillRef, 'list', 'bullet')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Elenco puntato"
                  >
                    <span className="text-xs font-bold">•</span>
                  </button>
                </div>
              </div>
              <div className="border-2 border-primary-300 rounded bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all quill-custom">
                <ReactQuill
                  ref={funzioniQuillRef}
                  theme="snow"
                  value={project.funzioni_progettate || ''}
                  onChange={(content) => handleChange('funzioni_progettate', content)}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Descrivi le funzioni progettate e collaudate..."
                />
              </div>
            </div>

            <div className="group/field">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-secondary-900">Finalità</label>
                <div className="flex gap-1 opacity-0 group-hover/field:opacity-100 transition-opacity">
                  <button
                    onClick={() => applyFormat(finalitaQuillRef, 'bold')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Grassetto"
                  >
                    <span className="font-bold text-xs">B</span>
                  </button>
                  <button
                    onClick={() => applyFormat(finalitaQuillRef, 'italic')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Corsivo"
                  >
                    <span className="italic text-xs">I</span>
                  </button>
                  <button
                    onClick={() => applyFormat(finalitaQuillRef, 'underline')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Sottolineato"
                  >
                    <span className="underline text-xs">U</span>
                  </button>
                  <button
                    onClick={() => applyFormat(finalitaQuillRef, 'list', 'ordered')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Elenco numerato"
                  >
                    <span className="text-xs">1.</span>
                  </button>
                  <button
                    onClick={() => applyFormat(finalitaQuillRef, 'list', 'bullet')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Elenco puntato"
                  >
                    <span className="text-xs font-bold">•</span>
                  </button>
                </div>
              </div>
              <div className="border-2 border-primary-300 rounded bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all quill-custom">
                <ReactQuill
                  ref={finalitaQuillRef}
                  theme="snow"
                  value={project.finalita || ''}
                  onChange={(content) => handleChange('finalita', content)}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Descrivi le finalità del progetto..."
                />
              </div>
            </div>

            <div className="group/field">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-secondary-900">Specifiche</label>
                <div className="flex gap-1 opacity-0 group-hover/field:opacity-100 transition-opacity">
                  <button
                    onClick={() => applyFormat(specificheQuillRef, 'bold')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Grassetto"
                  >
                    <span className="font-bold text-xs">B</span>
                  </button>
                  <button
                    onClick={() => applyFormat(specificheQuillRef, 'italic')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Corsivo"
                  >
                    <span className="italic text-xs">I</span>
                  </button>
                  <button
                    onClick={() => applyFormat(specificheQuillRef, 'underline')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Sottolineato"
                  >
                    <span className="underline text-xs">U</span>
                  </button>
                  <button
                    onClick={() => applyFormat(specificheQuillRef, 'list', 'ordered')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Elenco numerato"
                  >
                    <span className="text-xs">1.</span>
                  </button>
                  <button
                    onClick={() => applyFormat(specificheQuillRef, 'list', 'bullet')}
                    className="p-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200 transition-colors"
                    title="Elenco puntato"
                  >
                    <span className="text-xs font-bold">•</span>
                  </button>
                </div>
              </div>
              <div className="border-2 border-primary-300 rounded bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-all quill-custom">
                <ReactQuill
                  ref={specificheQuillRef}
                  theme="snow"
                  value={project.specifiche_tecniche || ''}
                  onChange={(content) => handleChange('specifiche_tecniche', content)}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Specifiche tecniche..."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Osservazioni/Note e Criticità Box */}
      <div className="bg-gradient-to-br from-white to-primary-50 rounded shadow-md border-2 border-primary-200 overflow-hidden">
        <div
          className="flex items-center justify-between cursor-pointer px-4 py-3 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-300 transition-colors border-b-2 border-primary-300"
          onClick={() => setShowOsservazioni(!showOsservazioni)}
        >
          <h2 className="text-base font-semibold text-secondary-900">Osservazioni/Note e Criticità</h2>
          {showOsservazioni ? (
            <ChevronUp className="w-5 h-5 text-secondary-700" />
          ) : (
            <ChevronDown className="w-5 h-5 text-secondary-700" />
          )}
        </div>

        {showOsservazioni && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-secondary-900 mb-1">Osservazioni e Note</label>
              <textarea
                ref={osservazioniRef}
                value={project.osservazioni_note || ''}
                onChange={(e) => {
                  handleChange('osservazioni_note', e.target.value);
                  handleTextareaResize(e);
                }}
                onInput={handleTextareaResize}
                className="w-full px-2.5 py-1.5 text-sm bg-white border-2 border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none overflow-hidden"
                placeholder="Inserisci osservazioni e note..."
                rows="3"
                style={{ minHeight: '80px' }}
              />
            </div>

            {/* Criticità - Dynamic List */}
            <div className="group/section">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-secondary-900">Criticità</label>
                {!showAddCriticalityForm && (
                  <button
                    onClick={() => setShowAddCriticalityForm(true)}
                    className="p-1 bg-primary-100 text-primary-600 rounded hover:bg-primary-200 transition-all opacity-0 group-hover/section:opacity-100"
                    title="Aggiungi criticità"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="bg-white border-2 border-primary-300 rounded overflow-hidden">
                {/* Criticalities list */}
                {criticalities.length === 0 && !showAddCriticalityForm ? (
                  <div className="text-center py-6 text-sm text-secondary-500 px-4">
                    <AlertCircle className="w-8 h-8 text-secondary-300 mx-auto mb-2" />
                    <p>Nessuna criticità aggiunta.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-secondary-200">
                    {criticalities.map((criticality, index) => (
                      <li key={criticality.id} className="group hover:bg-secondary-50 transition-colors">
                        {editingCriticality === criticality.id ? (
                          <div className="flex items-start gap-2 p-3">
                            <span className="flex-shrink-0 w-6 text-xs font-semibold text-danger-600 mt-1">
                              {index + 1}.
                            </span>
                            <textarea
                              value={editCriticalityText}
                              onChange={(e) => setEditCriticalityText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                  e.preventDefault();
                                  handleSaveCriticality(criticality.id);
                                }
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setEditingCriticality(null);
                                  setEditCriticalityText('');
                                }
                              }}
                              className="flex-1 px-2.5 py-1.5 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                              rows="2"
                              autoFocus
                            />
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleSaveCriticality(criticality.id)}
                                className="px-2.5 py-1.5 bg-success-600 text-white text-xs rounded hover:bg-success-700 transition-colors"
                                title="Salva (Ctrl+Enter)"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCriticality(null);
                                  setEditCriticalityText('');
                                }}
                                className="px-2.5 py-1.5 bg-secondary-300 text-secondary-700 text-xs rounded hover:bg-secondary-400 transition-colors"
                                title="Annulla (Esc)"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 p-3">
                            <span className="flex-shrink-0 w-6 text-xs font-semibold text-danger-600 mt-0.5">
                              {index + 1}.
                            </span>
                            <span className="flex-1 text-sm text-secondary-900 whitespace-pre-wrap">{criticality.criticality_text}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditCriticality(criticality)}
                                className="p-1.5 text-primary-600 hover:bg-primary-100 rounded transition-colors"
                                title="Modifica"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCriticality(criticality.id)}
                                className="p-1.5 text-danger-600 hover:bg-danger-100 rounded transition-colors"
                                title="Elimina"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}

                    {/* Add form as a list item when active */}
                    {showAddCriticalityForm && (
                      <li className="bg-primary-50 p-3">
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-6 text-xs font-semibold text-danger-600 mt-1">
                            {criticalities.length + 1}.
                          </span>
                          <textarea
                            value={newCriticality}
                            onChange={(e) => setNewCriticality(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                e.preventDefault();
                                handleAddCriticality();
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                handleCancelAddCriticality();
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 text-sm border-2 border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white resize-none"
                            placeholder="Inserisci la criticità... (Ctrl+Enter per salvare)"
                            rows="2"
                            autoFocus
                          />
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={handleAddCriticality}
                              className="px-2.5 py-1.5 bg-success-600 text-white text-xs rounded hover:bg-success-700 transition-colors"
                              title="Salva"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelAddCriticality}
                              className="px-2.5 py-1.5 bg-secondary-300 text-secondary-700 text-xs rounded hover:bg-secondary-400 transition-colors"
                              title="Annulla"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-900 mb-1">Eventuali Azioni Correttive o Integrative</label>
              <textarea
                ref={azioniRef}
                value={project.azioni_correttive || ''}
                onChange={(e) => {
                  handleChange('azioni_correttive', e.target.value);
                  handleTextareaResize(e);
                }}
                onInput={handleTextareaResize}
                className="w-full px-2.5 py-1.5 text-sm bg-white border-2 border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none overflow-hidden"
                placeholder="Descrivi eventuali azioni correttive o integrative necessarie..."
                rows="3"
                style={{ minHeight: '80px' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Features Section - Original functionality */}
      <div className="bg-gradient-to-br from-white to-primary-50 rounded shadow-md border-2 border-primary-200 overflow-hidden group/section mb-12">
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-300 transition-colors border-b-2 border-primary-300">
          <h2 className="text-base font-semibold text-secondary-900">Funzionalità Tecniche Dettagliate</h2>
          {!showAddForm && (
            <button
              onClick={handleAdd}
              className="p-1 bg-primary-100 text-primary-600 rounded hover:bg-primary-200 transition-all opacity-0 group-hover/section:opacity-100"
              title="Aggiungi funzionalità"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="p-4">

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-primary-50 border-2 border-primary-300 rounded shadow-sm p-4 mb-4">
            <h3 className="text-base font-semibold text-secondary-900 mb-3">Aggiungi Nuova Funzionalità</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Nome Funzionalità <span className="text-danger-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.feature_name}
                  onChange={(e) => setFormData({ ...formData, feature_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="es. Sistema di Autenticazione Utente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Descrizione
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows="4"
                  placeholder="Descrizione generale di cosa fa questa funzionalità e come funziona..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <Target className="w-4 h-4 inline mr-1" />
                  Finalità (Esplicita)
                </label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows="3"
                  placeholder="Perché serve questa funzionalità, quali problemi risolve, obiettivi di business..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  <Wrench className="w-4 h-4 inline mr-1" />
                  Specifiche Tecniche
                </label>
                <textarea
                  value={formData.tech_specs}
                  onChange={(e) => setFormData({ ...formData, tech_specs: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows="5"
                  placeholder="Dettagli tecnici: tecnologie utilizzate, architettura, API, database, framework, integrazioni..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveFeature}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-success-600 text-white text-sm rounded hover:bg-success-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvataggio...' : 'Salva Funzionalità'}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-secondary-300 text-secondary-700 text-sm rounded hover:bg-secondary-400 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* Features List */}
        {features.length === 0 && !showAddForm ? (
          <div className="text-center py-8 text-secondary-500">
            <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
            <p className="text-sm">Nessuna funzionalità aggiunta. Clicca "Aggiungi Funzionalità" per iniziare.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="bg-white rounded shadow-sm border border-secondary-200 overflow-hidden group"
              >
                {editingFeature === feature.id ? (
                  <div className="p-4 bg-warning-50">
                    <h3 className="text-base font-semibold text-secondary-900 mb-3">Modifica Funzionalità</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Nome Funzionalità <span className="text-danger-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.feature_name}
                          onChange={(e) => setFormData({ ...formData, feature_name: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          <FileText className="w-4 h-4 inline mr-1" />
                          Descrizione
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                          rows="4"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          <Target className="w-4 h-4 inline mr-1" />
                          Finalità (Esplicita)
                        </label>
                        <textarea
                          value={formData.purpose}
                          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                          rows="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          <Wrench className="w-4 h-4 inline mr-1" />
                          Specifiche Tecniche
                        </label>
                        <textarea
                          value={formData.tech_specs}
                          onChange={(e) => setFormData({ ...formData, tech_specs: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-secondary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                          rows="5"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleSaveFeature}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-success-600 text-white text-sm rounded hover:bg-success-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-secondary-300 text-secondary-700 text-sm rounded hover:bg-secondary-400 transition-colors"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-gradient-to-r from-primary-100 to-primary-200 px-4 py-3 border-b border-primary-300">
                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={() => toggleFeatureCollapse(feature.id)}
                        >
                          <h3 className="text-base font-semibold text-secondary-900">{feature.feature_name}</h3>
                          {collapsedFeatures[feature.id] ? (
                            <ChevronDown className="w-5 h-5 text-secondary-700" />
                          ) : (
                            <ChevronUp className="w-5 h-5 text-secondary-700" />
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(feature);
                            }}
                            className="p-1 bg-primary-100 text-primary-600 rounded hover:bg-primary-200 transition-all opacity-0 group-hover:opacity-100"
                            title="Modifica funzionalità"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFeature(feature.id);
                            }}
                            className="p-1 bg-danger-100 text-danger-600 rounded hover:bg-danger-200 transition-all opacity-0 group-hover:opacity-100"
                            title="Elimina funzionalità"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {!collapsedFeatures[feature.id] && (
                      <div className="p-4 space-y-4">
                      {feature.description && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <FileText className="w-4 h-4 text-primary-600" />
                            <h4 className="text-sm font-semibold text-secondary-900">Descrizione</h4>
                          </div>
                          <p className="text-sm text-secondary-700 whitespace-pre-wrap pl-5">{feature.description}</p>
                        </div>
                      )}
                      {feature.purpose && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Target className="w-4 h-4 text-success-600" />
                            <h4 className="text-sm font-semibold text-secondary-900">Finalità</h4>
                          </div>
                          <p className="text-sm text-secondary-700 whitespace-pre-wrap pl-5">{feature.purpose}</p>
                        </div>
                      )}
                      {feature.tech_specs && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Wrench className="w-4 h-4 text-warning-600" />
                            <h4 className="text-sm font-semibold text-secondary-900">Specifiche Tecniche</h4>
                          </div>
                          <p className="text-sm text-secondary-700 whitespace-pre-wrap pl-5 font-mono bg-secondary-50 p-3 rounded">{feature.tech_specs}</p>
                        </div>
                      )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Features;
