// frontend/src/components/Knowledge.jsx
import React, { useState, useEffect } from 'react';
import { knowledgeAPI } from '../services/api';
import { BookOpen, Calendar, Users, Star } from 'lucide-react';

const Knowledge = ({ projectId }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [projectId]);

  const loadSessions = async () => {
    try {
      const response = await knowledgeAPI.getSessions(projectId);
      setSessions(response.data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      const newSession = {
        session_topic: 'New Training Session',
        scheduled_date: new Date().toISOString().split('T')[0],
        duration: '2 hours',
        attendees: '',
        status: 'Scheduled',
        effectiveness_rating: null,
        notes: ''
      };

      const response = await knowledgeAPI.createSession(projectId, newSession);
      setSessions([...sessions, { ...newSession, id: response.data.id }]);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Knowledge Transfer Sessions
          </h2>
          <button
            onClick={handleCreateSession}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Schedule Session
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No knowledge transfer sessions scheduled yet.</p>
            <p className="text-sm mt-1">Click "Schedule Session" to add your first session.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{session.session_topic}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {session.scheduled_date}
                      </span>
                      <span>{session.duration}</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {session.status}
                      </span>
                    </div>
                  </div>
                  {session.effectiveness_rating && (
                    <div className="flex items-center gap-1 text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < session.effectiveness_rating ? 'fill-current' : ''
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Knowledge;
