import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, AlertCircle, Plus, Trash2, Edit2, X, ChevronDown, ChevronUp, Save } from 'lucide-react';

const Checklist = ({ projectId }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryText, setEditingCategoryText] = useState('');
  const [editingPhaseId, setEditingPhaseId] = useState(null);
  const [editingPhaseText, setEditingPhaseText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryPhase, setNewCategoryPhase] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [collapsedPhases, setCollapsedPhases] = useState({});
  const [collapsedCategories, setCollapsedCategories] = useState({});
  
  // Phase configuration - can be customized per project
  const [phases, setPhases] = useState([
    { id: 'Phase 1', name: 'Phase 1: Pre-Handover Assessment', color: 'blue' },
    { id: 'Phase 2', name: 'Phase 2: Knowledge Transfer Sessions', color: 'yellow' },
    { id: 'Phase 3', name: 'Phase 3: Final Sign-Offs', color: 'green' }
  ]);
  
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const defaultItems = [
    // Phase 1: Pre-Handover Assessment
    { phase: 'Phase 1', category: 'Technical Prerequisites', requirement: 'Code follows company coding standards', status: 'Not Started' },
    { phase: 'Phase 1', category: 'Technical Prerequisites', requirement: 'Code coverage ≥80%', status: 'Not Started' },
    { phase: 'Phase 1', category: 'Technical Prerequisites', requirement: 'All critical/high bugs resolved', status: 'Not Started' },
    { phase: 'Phase 1', category: 'Technical Prerequisites', requirement: 'Performance benchmarks met', status: 'Not Started' },
    { phase: 'Phase 1', category: 'Technical Prerequisites', requirement: 'Security review completed', status: 'Not Started' },
    { phase: 'Phase 1', category: 'Technical Prerequisites', requirement: 'Code repository organized', status: 'Not Started' },
    
    { phase: 'Phase 1', category: 'Documentation Prerequisites', requirement: 'Technical architecture documentation', status: 'Not Started' },
    { phase: 'Phase 1', category: 'Documentation Prerequisites', requirement: 'API documentation', status: 'Not Started' },
    { phase: 'Phase 1', category: 'Documentation Prerequisites', requirement: 'Database schema documentation', status: 'Not Started' },
    { phase: 'Phase 1', category: 'Documentation Prerequisites', requirement: 'Deployment guides', status: 'Not Started' },
    { phase: 'Phase 1', category: 'Documentation Prerequisites', requirement: 'User manuals', status: 'Not Started' },
    { phase: 'Phase 1', category: 'Documentation Prerequisites', requirement: 'Troubleshooting documentation', status: 'Not Started' },
    
    // Phase 2: Knowledge Transfer Sessions
    { phase: 'Phase 2', category: 'Training Sessions', requirement: 'Architecture Overview session scheduled', status: 'Not Started' },
    { phase: 'Phase 2', category: 'Training Sessions', requirement: 'Code Walkthrough session completed', status: 'Not Started' },
    { phase: 'Phase 2', category: 'Training Sessions', requirement: 'Database/Data Management training', status: 'Not Started' },
    { phase: 'Phase 2', category: 'Training Sessions', requirement: 'Deployment Procedures training', status: 'Not Started' },
    { phase: 'Phase 2', category: 'Training Sessions', requirement: 'Troubleshooting & Support training', status: 'Not Started' },
    { phase: 'Phase 2', category: 'Training Sessions', requirement: 'Shadow Support Period completed', status: 'Not Started' },
    
    { phase: 'Phase 2', category: 'Team Competency', requirement: 'Team demonstrates system understanding', status: 'Not Started' },
    { phase: 'Phase 2', category: 'Team Competency', requirement: 'Can perform basic operations independently', status: 'Not Started' },
    { phase: 'Phase 2', category: 'Team Competency', requirement: 'Can troubleshoot common issues', status: 'Not Started' },
    
    // Phase 3: Final Sign-Offs
    { phase: 'Phase 3', category: 'Approvals', requirement: 'R&D Project Lead sign-off', status: 'Not Started' },
    { phase: 'Phase 3', category: 'Approvals', requirement: 'R&D Technical Lead sign-off', status: 'Not Started' },
    { phase: 'Phase 3', category: 'Approvals', requirement: 'Automation Operations Manager sign-off', status: 'Not Started' },
    { phase: 'Phase 3', category: 'Approvals', requirement: 'Automation Technical Lead sign-off', status: 'Not Started' },
    { phase: 'Phase 3', category: 'Approvals', requirement: 'Department Manager sign-off', status: 'Not Started' },
    
    { phase: 'Phase 3', category: 'Documentation Handover', requirement: 'All documentation transferred', status: 'Not Started' },
    { phase: 'Phase 3', category: 'Documentation Handover', requirement: 'Access credentials provided', status: 'Not Started' },
    { phase: 'Phase 3', category: 'Documentation Handover', requirement: 'Repository access transferred', status: 'Not Started' },
    
    { phase: 'Phase 3', category: 'Transition Activities', requirement: 'Support contacts established', status: 'Not Started' },
    { phase: 'Phase 3', category: 'Transition Activities', requirement: 'Escalation procedures documented', status: 'Not Started' },
    { phase: 'Phase 3', category: 'Transition Activities', requirement: 'Post-handover support schedule defined', status: 'Not Started' },
  ];

  useEffect(() => {
    if (projectId) {
      // Reset phases to default first, then load custom names
      setPhases([
        { id: 'Phase 1', name: 'Phase 1: Pre-Handover Assessment', color: 'blue' },
        { id: 'Phase 2', name: 'Phase 2: Knowledge Transfer Sessions', color: 'yellow' },
        { id: 'Phase 3', name: 'Phase 3: Final Sign-Offs', color: 'green' }
      ]);
      loadChecklistItems();
      loadPhaseNames();
      loadCollapseState();
    }
  }, [projectId]);

  // Load collapse state from localStorage for this project
  const loadCollapseState = () => {
    try {
      const savedPhaseState = localStorage.getItem(`project_${projectId}_collapsedPhases`);
      const savedCategoryState = localStorage.getItem(`project_${projectId}_collapsedCategories`);

      if (savedPhaseState) {
        setCollapsedPhases(JSON.parse(savedPhaseState));
      } else {
        // Default: all phases collapsed for new project
        const initialCollapsedPhases = {};
        phases.forEach(phase => {
          initialCollapsedPhases[phase.id] = true;
        });
        setCollapsedPhases(initialCollapsedPhases);
      }

      if (savedCategoryState) {
        setCollapsedCategories(JSON.parse(savedCategoryState));
      } else {
        // Default: all categories collapsed for new project
        setCollapsedCategories({});
      }
    } catch (error) {
      console.error('Error loading collapse state:', error);
    }
  };

  // Save collapse state to localStorage
  const saveCollapseState = (phaseState, categoryState) => {
    try {
      if (phaseState !== null) {
        localStorage.setItem(`project_${projectId}_collapsedPhases`, JSON.stringify(phaseState));
      }
      if (categoryState !== null) {
        localStorage.setItem(`project_${projectId}_collapsedCategories`, JSON.stringify(categoryState));
      }
    } catch (error) {
      console.error('Error saving collapse state:', error);
    }
  };

  // Initialize categories as collapsed when items first load
  useEffect(() => {
    if (items.length > 0) {
      const savedCategoryState = localStorage.getItem(`project_${projectId}_collapsedCategories`);

      if (!savedCategoryState) {
        // First time loading this project - collapse all categories
        const initialCollapsedCategories = {};
        items.forEach(item => {
          const categoryKey = `${item.phase}-${item.category}`;
          initialCollapsedCategories[categoryKey] = true;
        });
        setCollapsedCategories(initialCollapsedCategories);
        saveCollapseState(null, initialCollapsedCategories);
      }
    }
  }, [items.length]);

  const loadChecklistItems = async () => {
    try {
      setLoading(true);
      console.log(`📥 Loading checklist for project ${projectId}`);
      
      const response = await fetch(`${API_BASE_URL}/checklist/${projectId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Checklist loaded:', data.length, 'items');
      
      if (data.length === 0) {
        console.log('📝 No items found, initializing with defaults...');
        await initializeDefaultItems();
      } else {
        setItems(data);
      }
    } catch (error) {
      console.error('❌ Error loading checklist:', error);
      setSaveStatus('Error loading checklist');
    } finally {
      setLoading(false);
    }
  };

  const loadPhaseNames = async () => {
    try {
      // Load custom phase names from database for this project
      const response = await fetch(`${API_BASE_URL}/phase-names/${projectId}`);

      if (!response.ok) {
        console.log('No custom phase names found, using defaults');
        return;
      }

      const phaseNamesData = await response.json();

      if (phaseNamesData.length > 0) {
        // Convert database format to phase array format
        const customPhases = phaseNamesData.map(pn => ({
          id: pn.phase_id,
          name: pn.phase_name,
          color: pn.phase_color
        }));
        setPhases(customPhases);
        console.log('✅ Loaded custom phase names from database');
      }
    } catch (error) {
      console.error('❌ Error loading phase names:', error);
    }
  };

  const savePhaseNames = async (updatedPhases) => {
    try {
      // Save custom phase names to database for this project
      const response = await fetch(`${API_BASE_URL}/phase-names/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phases: updatedPhases })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log('✅ Saved custom phase names to database');
    } catch (error) {
      console.error('❌ Error saving phase names:', error);
      throw error;
    }
  };

  const initializeDefaultItems = async () => {
    try {
      const promises = defaultItems.map(item =>
        fetch(`${API_BASE_URL}/checklist/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...item,
            verification_date: null,
            verified_by: '',
            notes: ''
          })
        })
      );
      
      await Promise.all(promises);
      console.log('✅ Default items initialized');
      await loadChecklistItems();
    } catch (error) {
      console.error('❌ Error initializing items:', error);
    }
  };

  const handleUpdateItem = async (itemId, updates) => {
    try {
      console.log(`💾 Updating item ${itemId}:`, updates);
      
      const response = await fetch(`${API_BASE_URL}/checklist/${projectId}/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setItems(items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ));

      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(''), 2000);
      
    } catch (error) {
      console.error('❌ Error updating item:', error);
      setSaveStatus('Error saving');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleAddCustomItem = async (phase = 'Phase 1', category = 'Custom') => {
    const newItem = {
      phase: phase,
      category: category,
      requirement: 'New custom requirement',
      status: 'Not Started',
      verification_date: null,
      verified_by: '',
      notes: ''
    };

    try {
      const response = await fetch(`${API_BASE_URL}/checklist/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setItems([...items, { ...newItem, id: result.id }]);
      
      setSaveStatus('Item added');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('❌ Error adding item:', error);
    }
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditingText(item.requirement);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (itemId) => {
    if (!editingText.trim()) {
      setSaveStatus('Name cannot be empty');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    try {
      await handleUpdateItem(itemId, { requirement: editingText });
      setEditingItemId(null);
      setEditingText('');
    } catch (error) {
      console.error('❌ Error updating requirement:', error);
    }
  };

  const handleStartEditCategory = (phase, category) => {
    setEditingCategoryId(`${phase}-${category}`);
    setEditingCategoryText(category);
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryText('');
  };

  const handleSaveEditCategory = async (phase, oldCategory) => {
    if (!editingCategoryText.trim()) {
      setSaveStatus('Category name cannot be empty');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    try {
      console.log(`📝 Updating category "${oldCategory}" to "${editingCategoryText}" in ${phase}`);

      const itemsToUpdate = items.filter(item =>
        item.phase === phase && item.category === oldCategory
      );

      console.log(`Found ${itemsToUpdate.length} items to update`);

      // Make all API calls to update the category name
      const promises = itemsToUpdate.map(item =>
        fetch(`${API_BASE_URL}/checklist/${projectId}/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: editingCategoryText })
        })
      );

      const responses = await Promise.all(promises);

      // Check if all responses were successful
      const allSuccessful = responses.every(response => response.ok);
      if (!allSuccessful) {
        throw new Error('Some updates failed');
      }

      console.log('✅ All API calls successful, reloading from database');

      // Clear editing state first
      setEditingCategoryId(null);
      setEditingCategoryText('');

      // Reload items from database to ensure sync
      await loadChecklistItems();

      setSaveStatus('Category updated');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('❌ Error updating category:', error);
      setSaveStatus('Error updating category');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleStartEditPhase = (phaseId) => {
    const phase = phases.find(p => p.id === phaseId);
    if (phase) {
      setEditingPhaseId(phaseId);
      setEditingPhaseText(phase.name);
    }
  };

  const handleCancelEditPhase = () => {
    setEditingPhaseId(null);
    setEditingPhaseText('');
  };

  const handleSaveEditPhase = async (phaseId) => {
    if (!editingPhaseText.trim()) {
      setSaveStatus('Phase name cannot be empty');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    try {
      const updatedPhases = phases.map(p => 
        p.id === phaseId ? { ...p, name: editingPhaseText } : p
      );
      
      setPhases(updatedPhases);
      await savePhaseNames(updatedPhases);
      
      setEditingPhaseId(null);
      setEditingPhaseText('');
      
      setSaveStatus('Phase name updated');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('❌ Error updating phase name:', error);
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      console.log(`🗑️ Deleting item ${itemToDelete.id}`);

      const response = await fetch(`${API_BASE_URL}/checklist/${projectId}/${itemToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setItems(items.filter(item => item.id !== itemToDelete.id));
      
      setShowDeleteModal(false);
      setItemToDelete(null);
      
      setSaveStatus('Item deleted');
      setTimeout(() => setSaveStatus(''), 2000);
      
      console.log('✅ Item deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting item:', error);
      setSaveStatus('Error deleting item');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleDeleteCategoryClick = (phase, category) => {
    setCategoryToDelete({ phase, category });
    setShowDeleteCategoryModal(true);
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      console.log(`🗑️ Deleting category ${categoryToDelete.category} from ${categoryToDelete.phase}`);

      const itemsToDelete = items.filter(item =>
        item.phase === categoryToDelete.phase && item.category === categoryToDelete.category
      );

      const promises = itemsToDelete.map(item =>
        fetch(`${API_BASE_URL}/checklist/${projectId}/${item.id}`, {
          method: 'DELETE'
        })
      );

      await Promise.all(promises);

      setItems(items.filter(item =>
        !(item.phase === categoryToDelete.phase && item.category === categoryToDelete.category)
      ));

      setShowDeleteCategoryModal(false);
      setCategoryToDelete(null);

      setSaveStatus('Category deleted');
      setTimeout(() => setSaveStatus(''), 2000);

      console.log('✅ Category deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      setSaveStatus('Error deleting category');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleDeleteCategoryCancel = () => {
    setShowDeleteCategoryModal(false);
    setCategoryToDelete(null);
  };

  const handleAddCategoryClick = (phaseId) => {
    setNewCategoryPhase(phaseId);
    setNewCategoryName('');
    setShowAddCategoryModal(true);
  };

  const handleAddCategoryConfirm = async () => {
    if (!newCategoryName.trim()) {
      setSaveStatus('Category name cannot be empty');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    const newItem = {
      phase: newCategoryPhase,
      category: newCategoryName,
      requirement: 'New requirement',
      status: 'Not Started',
      verification_date: null,
      verified_by: '',
      notes: ''
    };

    try {
      const response = await fetch(`${API_BASE_URL}/checklist/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setItems([...items, { ...newItem, id: result.id }]);

      setShowAddCategoryModal(false);
      setNewCategoryPhase('');
      setNewCategoryName('');

      setSaveStatus('Category added');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('❌ Error adding category:', error);
      setSaveStatus('Error adding category');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleAddCategoryCancel = () => {
    setShowAddCategoryModal(false);
    setNewCategoryPhase('');
    setNewCategoryName('');
  };

  const togglePhase = (phaseId) => {
    setCollapsedPhases(prev => {
      const newState = {
        ...prev,
        [phaseId]: !prev[phaseId]
      };
      saveCollapseState(newState, null);
      return newState;
    });
  };

  const toggleCategory = (key) => {
    setCollapsedCategories(prev => {
      const newState = {
        ...prev,
        [key]: !prev[key]
      };
      saveCollapseState(null, newState);
      return newState;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Complete':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Complete':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'In Progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPhaseColor = (color) => {
    const colors = {
      blue: 'from-blue-300 to-blue-400',
      yellow: 'from-yellow-300 to-yellow-400',
      green: 'from-green-300 to-green-400',
      orange: 'from-orange-300 to-orange-400',
      red: 'from-red-300 to-red-400',
      indigo: 'from-indigo-300 to-indigo-400'
    };
    return colors[color] || colors.blue;
  };

  // Group items by phase and category
  const groupedItems = items.reduce((acc, item) => {
    const phase = item.phase || 'Phase 1';
    const category = item.category || 'Uncategorized';
    
    if (!acc[phase]) {
      acc[phase] = {};
    }
    if (!acc[phase][category]) {
      acc[phase][category] = [];
    }
    acc[phase][category].push(item);
    return acc;
  }, {});

  const calculateProgress = () => {
    const completed = items.filter(item => item.status === 'Complete').length;
    return items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
  };

  const calculatePhaseProgress = (phaseItems) => {
    const completed = phaseItems.filter(item => item.status === 'Complete').length;
    return phaseItems.length > 0 ? Math.round((completed / phaseItems.length) * 100) : 0;
  };

  const calculateCategoryProgress = (categoryItems) => {
    const completed = categoryItems.filter(item => item.status === 'Complete').length;
    return categoryItems.length > 0 ? Math.round((completed / categoryItems.length) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delete Item Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Checklist Item?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 mb-2">You are about to delete:</p>
              <p className="font-semibold text-gray-900">{itemToDelete?.requirement}</p>
              <p className="text-sm text-gray-600 mt-1">
                Phase: {itemToDelete?.phase} | Category: {itemToDelete?.category}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {showDeleteCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Entire Category?</h3>
                <p className="text-sm text-gray-500">This will delete all items in this category</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 mb-2">You are about to delete:</p>
              <p className="font-semibold text-gray-900">{categoryToDelete?.category}</p>
              <p className="text-sm text-gray-600 mt-1">
                Phase: {categoryToDelete?.phase}
              </p>
              <p className="text-sm text-red-600 mt-2 font-medium">
                {items.filter(item =>
                  item.phase === categoryToDelete?.phase && item.category === categoryToDelete?.category
                ).length} item(s) will be deleted
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCategoryCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategoryConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
                <p className="text-sm text-gray-500">Create a new category in {phases.find(p => p.id === newCategoryPhase)?.name}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category name..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCategoryConfirm();
                  if (e.key === 'Escape') handleAddCategoryCancel();
                }}
              />
              <p className="text-xs text-gray-500 mt-2">
                A default item will be created in this category
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddCategoryCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategoryConfirm}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Handover Checklist</h2>
            <p className="text-sm text-gray-600 mt-1">
              Track progress across all handover phases
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className={`text-sm font-medium ${
                saveStatus.includes('Error') ? 'text-red-600' : 'text-green-600'
              }`}>
                {saveStatus}
              </span>
            )}
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">Overall Progress</span>
            <span className="font-bold text-blue-600">{calculateProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${calculateProgress()}%` }}
            >
              {calculateProgress() > 10 && (
                <span className="text-xs font-bold text-white">
                  {calculateProgress()}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {items.filter(i => i.status === 'Complete').length}
            </div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">
              {items.filter(i => i.status === 'In Progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">
              {items.filter(i => i.status === 'Not Started').length}
            </div>
            <div className="text-sm text-gray-600">Not Started</div>
          </div>
        </div>
      </div>

      {/* Checklist Items by Phase */}
      {phases.map((phaseInfo) => {
        const phaseItems = items.filter(item => item.phase === phaseInfo.id);
        const phaseProgress = calculatePhaseProgress(phaseItems);
        const isPhaseCollapsed = collapsedPhases[phaseInfo.id];

        if (!groupedItems[phaseInfo.id]) return null;

        return (
          <div key={phaseInfo.id} className="bg-white rounded-lg shadow-md border-2 border-gray-200 overflow-hidden">
            {/* Phase Header */}
            <div
              className={`bg-gradient-to-r ${getPhaseColor(phaseInfo.color)} p-6 cursor-pointer group`}
              onClick={() => togglePhase(phaseInfo.id)}
            >
              <div className="flex items-center justify-between text-gray-900">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {editingPhaseId === phaseInfo.id ? (
                      <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingPhaseText}
                          onChange={(e) => setEditingPhaseText(e.target.value)}
                          className="flex-1 px-4 py-2 text-gray-900 border-2 border-white rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                          autoFocus
                          placeholder="Enter phase name..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditPhase(phaseInfo.id);
                            if (e.key === 'Escape') handleCancelEditPhase();
                          }}
                        />
                        <button
                          onClick={() => handleSaveEditPhase(phaseInfo.id)}
                          className="p-2 bg-gray-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                          title="Save"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleCancelEditPhase}
                          className="p-2 bg-gray-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold">{phaseInfo.name}</h2>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditPhase(phaseInfo.id);
                          }}
                          className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-800 hover:bg-opacity-20 rounded-lg transition-all"
                          title="Edit phase name"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isPhaseCollapsed ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronUp className="w-5 h-5" />
                        )}
                      </>
                    )}
                  </div>
                  {editingPhaseId !== phaseInfo.id && (
                    <p className="text-sm mt-1 text-gray-700">
                      {phaseItems.filter(i => i.status === 'Complete').length} of {phaseItems.length} completed
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{phaseProgress}%</div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddCategoryClick(phaseInfo.id);
                      }}
                      className="px-3 py-1 bg-gray-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm flex items-center gap-1 transition-colors"
                      title="Add new category"
                    >
                      <Plus className="w-4 h-4" />
                      Add Category
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddCustomItem(phaseInfo.id);
                      }}
                      className="px-3 py-1 bg-gray-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm flex items-center gap-1 transition-colors"
                      title="Add item to existing category"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Phase Progress Bar */}
              <div className="w-full bg-white bg-opacity-40 rounded-full h-2 mt-4">
                <div
                  className="bg-white border border-black h-2 rounded-full transition-all duration-500"
                  style={{ width: `${phaseProgress}%` }}
                />
              </div>
            </div>

            {/* Categories within Phase */}
            {!isPhaseCollapsed && (
              <div className="divide-y divide-gray-200">
                {Object.entries(groupedItems[phaseInfo.id]).map(([category, categoryItems]) => {
                  const categoryProgress = calculateCategoryProgress(categoryItems);
                  const categoryKey = `${phaseInfo.id}-${category}`;
                  const isCategoryCollapsed = collapsedCategories[categoryKey];

                  return (
                    <div key={category} className="bg-gray-50">
                      {/* Category Header */}
                      <div 
                        className="px-6 py-4 bg-white border-b border-gray-200 cursor-pointer hover:bg-gray-50 group"
                        onClick={() => toggleCategory(categoryKey)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {isCategoryCollapsed ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            )}
                            
                            {editingCategoryId === categoryKey ? (
                              <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingCategoryText}
                                  onChange={(e) => setEditingCategoryText(e.target.value)}
                                  className="flex-1 px-3 py-1 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                                  placeholder="Enter category name..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEditCategory(phaseInfo.id, category);
                                    if (e.key === 'Escape') handleCancelEditCategory();
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveEditCategory(phaseInfo.id, category)}
                                  className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                  title="Save"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={handleCancelEditCategory}
                                  className="p-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <h3 className="font-semibold text-gray-900">{category}</h3>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEditCategory(phaseInfo.id, category);
                                    }}
                                    className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-all"
                                    title="Edit category name"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCategoryClick(phaseInfo.id, category);
                                    }}
                                    className="p-1 hover:bg-red-100 text-red-600 rounded transition-all"
                                    title="Delete category"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-600">
                              {categoryItems.filter(i => i.status === 'Complete').length}/{categoryItems.length}
                            </span>
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${categoryProgress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Category Items */}
                      {!isCategoryCollapsed && (
                        <div className="divide-y divide-gray-200">
                          {categoryItems.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-white transition-colors">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 pt-1">
                                  {getStatusIcon(item.status)}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex-1">
                                      {editingItemId === item.id ? (
                                        <div className="flex items-center gap-2 mb-2">
                                          <input
                                            type="text"
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            className="flex-1 px-3 py-2 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                            placeholder="Enter requirement..."
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit(item.id);
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <button
                                            onClick={() => handleSaveEdit(item.id)}
                                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            title="Save"
                                          >
                                            <CheckCircle className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={handleCancelEdit}
                                            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                            title="Cancel"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-start justify-between gap-2 mb-2 group">
                                          <h4 className="font-medium text-gray-900 flex-1">{item.requirement}</h4>
                                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={() => handleStartEdit(item)}
                                              className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                                              title="Edit name"
                                            >
                                              <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteClick(item)}
                                              className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                                              title="Delete item"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                      
                                      <select
                                        value={item.status}
                                        onChange={(e) => handleUpdateItem(item.id, { status: e.target.value })}
                                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(item.status)} cursor-pointer hover:shadow-sm transition-shadow`}
                                      >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Complete">Complete</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Item Details Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Verification Date
                                      </label>
                                      <input
                                        type="date"
                                        value={item.verification_date || ''}
                                        onChange={(e) => handleUpdateItem(item.id, { verification_date: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Verified By
                                      </label>
                                      <input
                                        type="text"
                                        value={item.verified_by || ''}
                                        onChange={(e) => handleUpdateItem(item.id, { verified_by: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Name"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Notes
                                      </label>
                                      <input
                                        type="text"
                                        value={item.notes || ''}
                                        onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Additional notes"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
};

export default Checklist;
