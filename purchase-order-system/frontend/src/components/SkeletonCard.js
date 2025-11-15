import React from 'react';

const SkeletonCard = () => {
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-5" 
      style={{ 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        isolation: 'isolate'
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-6 w-3/4 rounded skeleton" style={{ backgroundColor: '#f3f4f6' }}></div>
        <div className="h-6 w-16 rounded-full skeleton" style={{ backgroundColor: '#f3f4f6' }}></div>
      </div>
      <div className="space-y-2.5">
        <div className="flex justify-between">
          <div className="h-4 w-20 rounded skeleton" style={{ backgroundColor: '#f3f4f6' }}></div>
          <div className="h-4 w-16 rounded skeleton" style={{ backgroundColor: '#f3f4f6' }}></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-24 rounded skeleton" style={{ backgroundColor: '#f3f4f6' }}></div>
          <div className="h-4 w-20 rounded skeleton" style={{ backgroundColor: '#f3f4f6' }}></div>
        </div>
        <div className="flex justify-between pt-2">
          <div className="h-5 w-16 rounded skeleton" style={{ backgroundColor: '#f3f4f6' }}></div>
          <div className="h-5 w-24 rounded skeleton" style={{ backgroundColor: '#f3f4f6' }}></div>
        </div>
        <div className="flex justify-between pt-1">
          <div className="h-3 w-28 rounded skeleton" style={{ backgroundColor: '#f3f4f6' }}></div>
          <div className="h-3 w-32 rounded skeleton" style={{ backgroundColor: '#f3f4f6' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
