// frontend/src/components/Tracking.jsx
import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, MessageSquare } from 'lucide-react';

const Tracking = ({ projectId }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Progress Tracking & Communication Log
        </h2>
        <p className="text-gray-600">
          Tracking functionality coming soon. This will include:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
          <li>Team contact information management</li>
          <li>Issue tracking and resolution</li>
          <li>Communication log</li>
          <li>Resource allocation tracking</li>
          <li>Meeting notes and action items</li>
        </ul>
      </div>
    </div>
  );
};

export default Tracking;
