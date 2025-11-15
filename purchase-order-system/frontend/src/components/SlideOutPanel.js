import React, { useEffect } from 'react';
import { formatDate as formatDateUtil, formatCurrency as formatCurrencyUtil } from '../utils/formatters';

const SlideOutPanel = ({ order, onClose, onDelete, isOpen }) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll without changing position
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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

  if (!order) return null;

  return (
    <>
      {/* Backdrop with smooth transition */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Panel with smooth slide animation */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-label="Close panel"
            >
              <svg
                className="w-6 h-6 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ display: 'block' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Item Name</span>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{order.item_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Quantity</span>
                      <p className="text-base font-medium text-gray-900 mt-1">{order.quantity}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Unit Price</span>
                      <p className="text-base font-medium text-gray-900 mt-1">
                        {formatCurrencyUtil(order.unit_price)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Total Price</span>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrencyUtil(order.total_price)}
                    </p>
                  </div>
                </div>
              </section>

              {/* Dates */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Dates
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Order Date</span>
                    <p className="text-base font-medium text-gray-900 mt-1">
                      {formatDateUtil(order.order_date)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Delivery Date</span>
                    <p className="text-base font-medium text-gray-900 mt-1">
                      {formatDateUtil(order.delivery_date)}
                    </p>
                  </div>
                </div>
              </section>

              {/* Status */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Status
                </h3>
                <span
                  className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </section>

              {/* Extended Details */}
              {(order.description || order.vendor || order.category || order.shipping_address || order.notes) && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Extended Details
                  </h3>
                  <div className="space-y-4">
                    {order.description && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Description</span>
                        <p className="text-sm text-gray-900 mt-1">{order.description}</p>
                      </div>
                    )}
                    {order.vendor && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Vendor</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">{order.vendor}</p>
                      </div>
                    )}
                    {order.category && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Category</span>
                        <p className="text-sm font-medium text-gray-900 mt-1">{order.category}</p>
                      </div>
                    )}
                    {order.shipping_address && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Shipping Address</span>
                        <p className="text-sm text-gray-900 mt-1 whitespace-pre-line">
                          {order.shipping_address}
                        </p>
                      </div>
                    )}
                    {order.notes && (
                      <div>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">Notes</span>
                        <p className="text-sm text-gray-900 mt-1 whitespace-pre-line">{order.notes}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* Delete Button at Bottom */}
          <div className="border-t border-gray-200 p-6">
            <button
              onClick={onDelete}
              className="w-full px-6 py-3 bg-black text-white font-semibold rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ display: 'block' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Order
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SlideOutPanel;
