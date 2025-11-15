import React, { useEffect } from 'react';
import { formatDate as formatDateUtil, formatCurrency as formatCurrencyUtil } from '../utils/formatters';

const DeleteModal = ({ order, onConfirm, onCancel, isOpen }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen || !order) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Delete Purchase Order
          </h2>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this order? This action cannot be undone.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Item</span>
            <p className="text-base font-semibold text-gray-900 mt-1">
              {order.item_name}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Quantity</span>
              <p className="text-sm font-medium text-gray-900 mt-1">{order.quantity}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Unit Price</span>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatCurrencyUtil(order.unit_price)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Order Date</span>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatDateUtil(order.order_date)}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide">Delivery Date</span>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {formatDateUtil(order.delivery_date)}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Total Price</span>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {formatCurrencyUtil(order.total_price)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;

