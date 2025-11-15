import React, { useState, useRef, useEffect } from 'react';

const OrderCard = ({ order, onDelete, onOpen, formatDate, formatCurrency, isDeleting = false }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const cardRef = useRef(null);
  const SWIPE_THRESHOLD = 0.5;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleStart = (clientX) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleMove = (clientX) => {
    if (!isDragging) return;
    const deltaX = clientX - startX;
    const cardWidth = cardRef.current?.offsetWidth || 0;
    const maxSwipe = cardWidth * SWIPE_THRESHOLD;
    
    if (deltaX < 0) {
      setSwipeOffset(Math.max(deltaX, -maxSwipe));
    } else {
      setSwipeOffset(0);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const cardWidth = cardRef.current?.offsetWidth || 0;
    const threshold = cardWidth * SWIPE_THRESHOLD;
    
    if (Math.abs(swipeOffset) >= threshold) {
      onDelete(order);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleMouseDown = (e) => {
    // Don't prevent default on card click - allow it to open panel
    if (e.target.closest('button') || e.target.closest('svg')) {
      e.preventDefault();
    }
    handleStart(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleTouchStart = (e) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startX, swipeOffset]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.pending;
  };

  const cardWidth = cardRef.current?.offsetWidth || 0;
  const deleteRevealed = Math.abs(swipeOffset) >= cardWidth * SWIPE_THRESHOLD;
  const showDeleteBg = isDragging && swipeOffset < 0;

  // Prevent shadow flash on initial render
  const baseShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  const hoverShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';

  const handleCardClick = (e) => {
    // Only open if not dragging and not clicking on status badge or delete area
    if (!isDragging && !e.target.closest('.status-badge') && swipeOffset === 0) {
      onOpen(order);
    }
  };

  return (
    <div className="relative overflow-hidden" style={{ padding: '8px' }}>
      {/* Delete action background - only show when actively swiping */}
      {showDeleteBg && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 transition-opacity duration-200"
          style={{ 
            width: `${cardWidth * SWIPE_THRESHOLD}px`, 
            borderRadius: '0.5rem',
            opacity: deleteRevealed ? 1 : 0.5,
            zIndex: 1
          }}
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>
      )}

      {/* Card with proper spacing for shadow */}
      <div
        ref={cardRef}
        className={`bg-white rounded-lg border border-gray-200 transition-all duration-300 cursor-pointer ${
          isDragging ? 'select-none' : ''
        } ${isDeleting ? 'card-deleting' : ''}`}
        style={{
          transform: isDeleting 
            ? 'translateX(-100%) scale(0.95)' 
            : `translateX(${swipeOffset}px)`,
          opacity: isDeleting ? 0 : 1,
          transition: isDragging 
            ? 'none' 
            : isDeleting
              ? 'all 0.3s ease-out'
              : 'transform 0.2s ease-out, box-shadow 0.3s ease-out, opacity 0.3s ease-out',
          boxShadow: isMounted ? baseShadow : 'none',
          position: 'relative',
          zIndex: 2,
        }}
        onMouseEnter={(e) => {
          if (!isDragging && isMounted && !isDeleting) {
            e.currentTarget.style.boxShadow = hoverShadow;
            e.currentTarget.style.transform = `translateY(-4px) translateX(${swipeOffset}px)`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging && isMounted && !isDeleting) {
            e.currentTarget.style.boxShadow = baseShadow;
            e.currentTarget.style.transform = `translateY(0) translateX(${swipeOffset}px)`;
          }
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
              {order.item_name}
            </h3>
            <span
              className={`status-badge ml-2 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>

          <div className="space-y-2.5 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Quantity:</span>
              <span className="font-medium text-gray-900">{order.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span>Unit Price:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(order.unit_price)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="font-bold text-gray-900 text-base">
                {formatCurrency(order.total_price)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-1">
              <span>Order: {formatDate(order.order_date)}</span>
              <span>Delivery: {formatDate(order.delivery_date)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
