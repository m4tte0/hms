import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle, AlertCircle, Edit2, X, ChevronDown, ChevronUp, Award, Target, Trash2, Plus, Save } from 'lucide-react';

const Assessment = ({ projectId }) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryText, setEditingCategoryText] = useState('');
  const [editingPhaseId, setEditingPhaseId] = useState(null);
  const [editingPhaseText, setEditingPhaseText] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [collapsedPhases, setCollapsedPhases] = useState({});
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [phases, setPhases] = useState([
    { id: 'Phase 1', name: 'Phase 1: Pre-Handover Assessment', color: 'blue', weight: 50 },
    { id: 'Phase 2', name: 'Phase 2: Knowledge Transfer Sessions', color: 'yellow', weight: 25 },
    { id: 'Phase 3', name: 'Phase 3: Final Sign-Offs', color: 'green', weight: 25 }
  ]);

  const defaultAssessments = [
    // Phase 1: Pre-Handover Assessment (50% weight)
    { 
      phase: 'Phase 1', 
      category: 'B1: Code Quality', 
      categoryWeight: 25,
      criteria: 'Code follows established standards and conventions', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 1', 
      category: 'B1: Code Quality', 
      categoryWeight: 25,
      criteria: 'Code is well-structured and maintainable', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 1', 
      category: 'B1: Code Quality', 
      categoryWeight: 25,
      criteria: 'Adequate code comments and inline documentation', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 1', 
      category: 'B1: Code Quality', 
      categoryWeight: 25,
      criteria: 'Code review process has been followed', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 1', 
      category: 'B1: Code Quality', 
      categoryWeight: 25,
      criteria: 'Version control history is complete and organized', 
      score: null,
      evidence: ''
    },

    { 
      phase: 'Phase 1', 
      category: 'B2: Testing Coverage', 
      categoryWeight: 20,
      criteria: 'Unit test coverage meets minimum requirements (≥80%)', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 1', 
      category: 'B2: Testing Coverage', 
      categoryWeight: 20,
      criteria: 'Integration tests cover critical workflows', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 1', 
      category: 'B2: Testing Coverage', 
      categoryWeight: 20,
      criteria: 'End-to-end testing scenarios complete', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 1', 
      category: 'B2: Testing Coverage', 
      categoryWeight: 20,
      criteria: 'Performance testing conducted and passed', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 1', 
      category: 'B2: Testing Coverage', 
      categoryWeight: 20,
      criteria: 'Security testing performed', 
      score: null,
      evidence: ''
    },

    { 
      phase: 'Phase 1', 
      category: 'B3: Performance & Security', 
      categoryWeight: 15,
      criteria: 'Performance benchmarks met or exceeded', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 1', 
      category: 'B3: Performance & Security', 
      categoryWeight: 15,
      criteria: 'Security vulnerabilities addressed', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 1', 
      category: 'B3: Performance & Security', 
      categoryWeight: 15,
      criteria: 'Load testing completed successfully', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 1', 
      category: 'B3: Performance & Security', 
      categoryWeight: 15,
      criteria: 'Security best practices implemented', 
      score: null,
      evidence: ''
    },

    { 
      phase: 'Phase 1', 
      category: 'B4: Technical Debt', 
      categoryWeight: 10,
      criteria: 'Technical debt documented and manageable', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 1', 
      category: 'B4: Technical Debt', 
      categoryWeight: 10,
      criteria: 'No critical technical debt remaining', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 1', 
      category: 'B4: Technical Debt', 
      categoryWeight: 10,
      criteria: 'Refactoring needs identified and prioritized', 
      score: null,
      evidence: ''
    },

    // Phase 2: Documentation Quality (25% weight)
    { 
      phase: 'Phase 2', 
      category: 'C1: Technical Documentation', 
      categoryWeight: 35,
      criteria: 'Architecture documentation is complete and clear', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 2', 
      category: 'C1: Technical Documentation', 
      categoryWeight: 35,
      criteria: 'API documentation is comprehensive', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 2', 
      category: 'C1: Technical Documentation', 
      categoryWeight: 35,
      criteria: 'Database schema documented', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 2', 
      category: 'C1: Technical Documentation', 
      categoryWeight: 35,
      criteria: 'Integration points documented', 
      score: null,
      evidence: ''
    },

    { 
      phase: 'Phase 2', 
      category: 'C2: User Documentation', 
      categoryWeight: 30,
      criteria: 'User manuals are complete and accurate', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 2', 
      category: 'C2: User Documentation', 
      categoryWeight: 30,
      criteria: 'Training materials prepared', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 2', 
      category: 'C2: User Documentation', 
      categoryWeight: 30,
      criteria: 'FAQ documentation available', 
      score: null,
      evidence: ''
    },

    { 
      phase: 'Phase 2', 
      category: 'C3: Operational Documentation', 
      categoryWeight: 35,
      criteria: 'Deployment procedures documented', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 2', 
      category: 'C3: Operational Documentation', 
      categoryWeight: 35,
      criteria: 'Troubleshooting guides available', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 2', 
      category: 'C3: Operational Documentation', 
      categoryWeight: 35,
      criteria: 'Monitoring and alerting documented', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 2', 
      category: 'C3: Operational Documentation', 
      categoryWeight: 35,
      criteria: 'Rollback procedures documented', 
      score: null,
      evidence: ''
    },

    // Phase 3: Operational Readiness (25% weight)
    { 
      phase: 'Phase 3', 
      category: 'D1: Deployment Readiness', 
      categoryWeight: 35,
      criteria: 'Deployment process tested and validated', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 3', 
      category: 'D1: Deployment Readiness', 
      categoryWeight: 35,
      criteria: 'Infrastructure requirements met', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 3', 
      category: 'D1: Deployment Readiness', 
      categoryWeight: 35,
      criteria: 'Deployment automation in place', 
      score: null,
      evidence: ''
    },

    { 
      phase: 'Phase 3', 
      category: 'D2: Support Readiness', 
      categoryWeight: 35,
      criteria: 'Support team trained and ready', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 3', 
      category: 'D2: Support Readiness', 
      categoryWeight: 35,
      criteria: 'Escalation procedures defined', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 3', 
      category: 'D2: Support Readiness', 
      categoryWeight: 35,
      criteria: 'On-call rotation established', 
      score: null,
      evidence: ''
    },

    { 
      phase: 'Phase 3', 
      category: 'D3: Team Readiness', 
      categoryWeight: 30,
      criteria: 'Knowledge transfer sessions completed', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 3', 
      category: 'D3: Team Readiness', 
      categoryWeight: 30,
      criteria: 'Team demonstrates competency', 
      score: null,
      evidence: ''
    },
    { 
      phase: 'Phase 3', 
      category: 'D3: Team Readiness', 
      categoryWeight: 30,
      criteria: 'Shadow support period completed successfully', 
      score: null,
      evidence: ''
    }
  ];

  useEffect(() => {
    if (projectId) {
      // Reset phases to default first, then load custom names
      setPhases([
        { id: 'Phase 1', name: 'Phase 1: Pre-Handover Assessment', color: 'blue', weight: 50 },
        { id: 'Phase 2', name: 'Phase 2: Knowledge Transfer Sessions', color: 'yellow', weight: 25 },
        { id: 'Phase 3', name: 'Phase 3: Final Sign-Offs', color: 'green', weight: 25 }
      ]);
      loadAssessments();
      loadPhaseNames();
    }
  }, [projectId]);

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
          color: pn.phase_color,
          weight: phases.find(p => p.id === pn.phase_id)?.weight || 25
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

  const loadAssessments = async () => {
    try {
      setLoading(true);
      console.log(`📥 Loading assessments for project ${projectId}`);
      
      const response = await fetch(`${API_BASE_URL}/assessment/${projectId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Assessments loaded:', data.length, 'items');
      
      if (data.length === 0) {
        console.log('📝 No assessments found, initializing with defaults...');
        await initializeDefaultAssessments();
      } else {
        setAssessments(data);
      }
    } catch (error) {
      console.error('❌ Error loading assessments:', error);
      setSaveStatus('Error loading assessments');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultAssessments = async () => {
    try {
      const promises = defaultAssessments.map(item =>
        fetch(`${API_BASE_URL}/assessment/${projectId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...item,
            assessment_date: new Date().toISOString().split('T')[0],
            assessed_by: ''
          })
        })
      );
      
      await Promise.all(promises);
      console.log('✅ Default assessments initialized');
      await loadAssessments();
    } catch (error) {
      console.error('❌ Error initializing assessments:', error);
    }
  };

  const handleUpdateAssessment = async (assessmentId, updates) => {
    try {
      console.log(`💾 Updating assessment ${assessmentId}:`, updates);
      
      const response = await fetch(`${API_BASE_URL}/assessment/${projectId}/${assessmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setAssessments(assessments.map(item =>
        item.id === assessmentId ? { ...item, ...updates } : item
      ));

      setSaveStatus('Saved');
      setTimeout(() => setSaveStatus(''), 2000);
      
    } catch (error) {
      console.error('❌ Error updating assessment:', error);
      setSaveStatus('Error saving');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleAddCustomCriteria = async (phase = 'Phase 1', category = 'Custom') => {
    const newItem = {
      phase: phase,
      category: category,
      categoryWeight: 10,
      criteria: 'New custom criteria',
      score: null,
      evidence: '',
      assessment_date: new Date().toISOString().split('T')[0],
      assessed_by: ''
    };

    try {
      const response = await fetch(`${API_BASE_URL}/assessment/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setAssessments([...assessments, { ...newItem, id: result.id }]);
      
      setSaveStatus('Criteria added');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('❌ Error adding criteria:', error);
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
      const itemsToUpdate = assessments.filter(item =>
        item.phase === phase && item.category === oldCategory
      );

      const promises = itemsToUpdate.map(item =>
        fetch(`${API_BASE_URL}/assessment/${projectId}/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category: editingCategoryText })
        })
      );

      const responses = await Promise.all(promises);
      const allSuccessful = responses.every(response => response.ok);
      if (!allSuccessful) {
        throw new Error('Some updates failed');
      }

      setEditingCategoryId(null);
      setEditingCategoryText('');

      await loadAssessments();

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
      const response = await fetch(`${API_BASE_URL}/assessment/${projectId}/${itemToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setAssessments(assessments.filter(item => item.id !== itemToDelete.id));
      
      setShowDeleteModal(false);
      setItemToDelete(null);
      
      setSaveStatus('Criteria deleted');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('❌ Error deleting criteria:', error);
      setSaveStatus('Error deleting criteria');
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

      const itemsToDelete = assessments.filter(item =>
        item.phase === categoryToDelete.phase && item.category === categoryToDelete.category
      );

      const promises = itemsToDelete.map(item =>
        fetch(`${API_BASE_URL}/assessment/${projectId}/${item.id}`, {
          method: 'DELETE'
        })
      );

      await Promise.all(promises);

      setAssessments(assessments.filter(item =>
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

  const handleStartEditItem = (item) => {
    setEditingItemId(item.id);
    setEditingItemText(item.criteria);
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditingItemText('');
  };

  const handleSaveEditItem = async (itemId) => {
    if (!editingItemText.trim()) {
      setSaveStatus('Criteria cannot be empty');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    try {
      await handleUpdateAssessment(itemId, { criteria: editingItemText });
      setEditingItemId(null);
      setEditingItemText('');
    } catch (error) {
      console.error('❌ Error updating criteria:', error);
    }
  };

  const togglePhase = (phaseId) => {
    setCollapsedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  const toggleCategory = (key) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getScoreColor = (score) => {
    if (!score) return 'bg-gray-100 text-secondary-600';
    if (score >= 4) return 'bg-green-100 text-green-800';
    if (score >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreLabel = (score) => {
    if (!score) return 'Not Scored';
    const labels = {
      1: '1 - Poor',
      2: '2 - Below Standard',
      3: '3 - Satisfactory',
      4: '4 - Good',
      5: '5 - Excellent'
    };
    return labels[score] || 'Not Scored';
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
  const groupedAssessments = assessments.reduce((acc, item) => {
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

  const calculateCategoryScore = (categoryItems) => {
    const scoredItems = categoryItems.filter(item => item.score !== null && item.score > 0);
    if (scoredItems.length === 0) return 0;
    
    const average = scoredItems.reduce((sum, item) => sum + item.score, 0) / scoredItems.length;
    return Math.round((average / 5) * 100);
  };

  const calculatePhaseScore = (phaseItems) => {
    const scoredItems = phaseItems.filter(item => item.score !== null && item.score > 0);
    if (scoredItems.length === 0) return 0;
    
    const average = scoredItems.reduce((sum, item) => sum + item.score, 0) / scoredItems.length;
    return Math.round((average / 5) * 100);
  };

  const calculateOverallScore = () => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    phases.forEach(phaseInfo => {
      const phaseItems = assessments.filter(item => item.phase === phaseInfo.id);
      const scoredItems = phaseItems.filter(item => item.score !== null && item.score > 0);
      
      if (scoredItems.length > 0) {
        const phaseAverage = scoredItems.reduce((sum, item) => sum + item.score, 0) / scoredItems.length;
        const phaseScore = (phaseAverage / 5) * 100;
        totalWeightedScore += phaseScore * phaseInfo.weight;
        totalWeight += phaseInfo.weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  };

  const getReadinessLevel = (score) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 80) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 70) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (score >= 60) return { label: 'Poor', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: 'Not Ready', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const overallScore = calculateOverallScore();
  const readiness = getReadinessLevel(overallScore);

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
                <h3 className="text-lg font-semibold text-secondary-900">Delete Assessment Criteria?</h3>
                <p className="text-sm text-secondary-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-secondary-700 mb-2">You are about to delete:</p>
              <p className="font-semibold text-secondary-900">{itemToDelete?.criteria}</p>
              <p className="text-sm text-secondary-600 mt-1">
                Phase: {itemToDelete?.phase} | Category: {itemToDelete?.category}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-secondary-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                <h3 className="text-lg font-semibold text-secondary-900">Delete Entire Category?</h3>
                <p className="text-sm text-secondary-500">This will delete all items in this category</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-secondary-700 mb-2">You are about to delete:</p>
              <p className="font-semibold text-secondary-900">{categoryToDelete?.category}</p>
              <p className="text-sm text-secondary-600 mt-1">
                Phase: {categoryToDelete?.phase}
              </p>
              <p className="text-sm text-red-600 mt-2 font-medium">
                {assessments.filter(item =>
                  item.phase === categoryToDelete?.phase && item.category === categoryToDelete?.category
                ).length} item(s) will be deleted
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCategoryCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-secondary-700 rounded-lg hover:bg-gray-50 transition-colors"
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

      {/* Overall Score Dashboard */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Project Readiness Assessment</h2>
            <p className="text-sm text-secondary-600 mt-1">
              Comprehensive evaluation across all handover phases
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

        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${readiness.bg} border-2 ${readiness.color.replace('text-', 'border-')} rounded-lg p-6`}>
            <div className="flex items-center justify-between mb-2">
              <Award className={`w-8 h-8 ${readiness.color}`} />
              <span className={`text-sm font-semibold ${readiness.color}`}>{readiness.label}</span>
            </div>
            <div className={`text-4xl font-bold ${readiness.color} mb-1`}>
              {overallScore}%
            </div>
            <div className="text-sm text-secondary-600">Overall Readiness</div>
          </div>

          {phases.map(phaseInfo => {
            const phaseItems = assessments.filter(item => item.phase === phaseInfo.id);
            const phaseScore = calculatePhaseScore(phaseItems);
            
            return (
              <div key={phaseInfo.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-6 h-6 text-gray-400" />
                  <span className="text-xs font-semibold text-secondary-500">{phaseInfo.weight}% weight</span>
                </div>
                <div className="text-3xl font-bold text-secondary-900 mb-1">
                  {phaseScore}%
                </div>
                <div className="text-sm text-secondary-600">{phaseInfo.name.split(':')[0]}</div>
              </div>
            );
          })}
        </div>

        {/* Readiness Scale */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-secondary-900 mb-3 text-sm">Readiness Level Classification:</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span><strong>90-100:</strong> Excellent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span><strong>80-89:</strong> Good</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span><strong>70-79:</strong> Fair</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span><strong>60-69:</strong> Poor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span><strong>&lt;60:</strong> Not Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Items by Phase */}
      {phases.map((phaseInfo) => {
        const phaseItems = assessments.filter(item => item.phase === phaseInfo.id);
        const phaseScore = calculatePhaseScore(phaseItems);
        const isPhaseCollapsed = collapsedPhases[phaseInfo.id];

        if (!groupedAssessments[phaseInfo.id]) return null;

        return (
          <div key={phaseInfo.id} className="bg-white rounded-lg shadow-md border-2 border-gray-200 overflow-hidden">
            {/* Phase Header */}
            <div
              className={`bg-gradient-to-r ${getPhaseColor(phaseInfo.color)} p-6 cursor-pointer group`}
              onClick={() => togglePhase(phaseInfo.id)}
            >
              <div className="flex items-center justify-between text-secondary-900">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {editingPhaseId === phaseInfo.id ? (
                      <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingPhaseText}
                          onChange={(e) => setEditingPhaseText(e.target.value)}
                          className="flex-1 px-4 py-2 text-secondary-900 border-2 border-white rounded-md focus:outline-none focus:ring-2 focus:ring-white"
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
                    <p className="text-sm mt-1 text-secondary-700">
                      {phaseItems.filter(i => i.score !== null && i.score > 0).length} of {phaseItems.length} scored • {phaseInfo.weight}% of total
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{phaseScore}%</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddCustomCriteria(phaseInfo.id);
                    }}
                    className="mt-2 px-3 py-1 bg-gray-800 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Criteria
                  </button>
                </div>
              </div>

              {/* Phase Progress Bar */}
              <div className="w-full bg-white bg-opacity-40 rounded-full h-2 mt-4">
                <div
                  className="bg-white border border-black h-2 rounded-full transition-all duration-500"
                  style={{ width: `${phaseScore}%` }}
                />
              </div>
            </div>

            {/* Categories within Phase */}
            {!isPhaseCollapsed && (
              <div className="divide-y divide-gray-200">
                {Object.entries(groupedAssessments[phaseInfo.id]).map(([category, categoryItems]) => {
                  const categoryScore = calculateCategoryScore(categoryItems);
                  const categoryKey = `${phaseInfo.id}-${category}`;
                  const isCategoryCollapsed = collapsedCategories[categoryKey];
                  const categoryWeight = categoryItems[0]?.categoryWeight || 0;

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
                                <h3 className="font-semibold text-secondary-900">{category}</h3>
                                <span className="text-xs text-secondary-500 bg-gray-100 px-2 py-1 rounded">
                                  {categoryWeight}% weight
                                </span>
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
                            <span className="text-sm font-medium text-secondary-600">
                              {categoryItems.filter(i => i.score !== null && i.score > 0).length}/{categoryItems.length} scored
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${categoryScore}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-secondary-900 w-12 text-right">
                                {categoryScore}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Category Items */}
                      {!isCategoryCollapsed && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                          {categoryItems.map((item) => (
                            <div key={item.id} className="px-4 py-2 hover:bg-white transition-colors group border-b border-gray-100">
                              {editingItemId === item.id ? (
                                <div className="flex items-center gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={editingItemText}
                                    onChange={(e) => setEditingItemText(e.target.value)}
                                    className="flex-1 px-3 py-1 text-sm border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                    placeholder="Enter criteria..."
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEditItem(item.id);
                                      if (e.key === 'Escape') handleCancelEditItem();
                                    }}
                                  />
                                  <button
                                    onClick={() => handleSaveEditItem(item.id)}
                                    className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    title="Save"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelEditItem}
                                    className="p-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-3">
                                    {/* Criteria and Score in one line */}
                                    <div className="flex-1 flex items-center gap-3 min-w-0">
                                      <h4 className="text-sm text-secondary-900 flex-1 truncate" title={item.criteria}>
                                        {item.criteria}
                                      </h4>

                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <select
                                          value={item.score || ''}
                                          onChange={(e) => handleUpdateAssessment(item.id, {
                                            score: e.target.value ? parseInt(e.target.value) : null
                                          })}
                                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getScoreColor(item.score)} cursor-pointer hover:shadow-sm transition-shadow`}
                                        >
                                          <option value="">Not Scored</option>
                                          <option value="1">1 - Poor</option>
                                          <option value="2">2 - Below Standard</option>
                                          <option value="3">3 - Satisfactory</option>
                                          <option value="4">4 - Good</option>
                                          <option value="5">5 - Excellent</option>
                                        </select>

                                        {item.score && (
                                          <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                              <div
                                                key={i}
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                  i < item.score ? 'bg-blue-600' : 'bg-gray-300'
                                                }`}
                                              />
                                            ))}
                                          </div>
                                        )}

                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => handleStartEditItem(item)}
                                            className="p-1 hover:bg-blue-100 text-blue-600 rounded transition-all"
                                            title="Edit criteria"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteClick(item)}
                                            className="p-1 hover:bg-red-100 text-red-600 rounded transition-all"
                                            title="Delete criteria"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Evidence/Notes - Compact */}
                                  {item.evidence && (
                                    <div className="mt-1 ml-0">
                                      <p className="text-xs text-secondary-600 italic">{item.evidence}</p>
                                    </div>
                                  )}
                                  {!item.evidence && (
                                    <div className="mt-1 ml-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <input
                                        type="text"
                                        value={item.evidence || ''}
                                        onChange={(e) => handleUpdateAssessment(item.id, { evidence: e.target.value })}
                                        className="w-full px-2 py-0.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Add evidence or notes..."
                                      />
                                    </div>
                                  )}
                                </>
                              )}
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

export default Assessment;
