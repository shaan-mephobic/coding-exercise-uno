import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import OrderCard from './components/OrderCard';
import DeleteModal from './components/DeleteModal';
import SlideOutPanel from './components/SlideOutPanel';
import Toast from './components/Toast';
import SkeletonCard from './components/SkeletonCard';
import ConfirmDialog from './components/ConfirmDialog';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import { formatDate, formatCurrency } from './utils/formatters';

// Toast helper function
const showToast = (message, type = 'success') => {
  return { message, type };
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [deleteOrder, setDeleteOrder] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    sortBy: 'id',
    sortOrder: 'asc',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const {
    orders,
    loading,
    loadingMore,
    error,
    hasNext,
    removeOrder,
    lastOrderElementRef,
    loadMore,
  } = useInfiniteScroll({
    ...filters,
    search: debouncedSearch,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const handleOpenOrder = useCallback((order) => {
    setSelectedOrder(order);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    // Delay removing order to allow exit animation
    setTimeout(() => {
      setSelectedOrder(null);
    }, 300);
  }, []);

  const handleDeleteClick = useCallback((order) => {
    setDeleteOrder(order);
  }, []);

  const handleDeleteFromPanel = useCallback(() => {
    if (!selectedOrder) return;
    setConfirmDelete(selectedOrder);
  }, [selectedOrder]);

  const handleConfirmDeleteFromPanel = useCallback(async () => {
    if (!confirmDelete) return;

    const orderId = confirmDelete.id;
    setDeletingOrderId(orderId);
    setConfirmDelete(null);
    setSelectedOrder(null);

    try {
      await axios.delete(`${API_URL}/api/purchase-orders/${orderId}`);
      // Wait for animation
      setTimeout(() => {
        removeOrder(orderId);
        setDeletingOrderId(null);
        const toastResult = showToast('Order deleted successfully', 'success');
        if (toastResult) setToast(toastResult);
      }, 300);
    } catch (err) {
      setDeletingOrderId(null);
      const toastResult = showToast('Failed to delete order', 'error');
      if (toastResult) setToast(toastResult);
      console.error(err);
    }
  }, [confirmDelete, removeOrder]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteOrder) return;

    const orderId = deleteOrder.id;
    setDeletingOrderId(orderId);
    setDeleteOrder(null);

    try {
      await axios.delete(`${API_URL}/api/purchase-orders/${orderId}`);
      // Wait for animation
      setTimeout(() => {
        removeOrder(orderId);
        setDeletingOrderId(null);
        const toastResult = showToast('Order deleted successfully', 'success');
        if (toastResult) setToast(toastResult);
      }, 300);
    } catch (err) {
      setDeletingOrderId(null);
      const toastResult = showToast('Failed to delete order', 'error');
      if (toastResult) setToast(toastResult);
      console.error(err);
    }
  }, [deleteOrder, removeOrder]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteOrder(null);
  }, []);

  // Card Grid Component - simplified without virtualization
  const CardGrid = ({ orders, deletingOrderId, onDelete, onOpen, formatDate, formatCurrency, lastOrderElementRef, hasNext, loadingMore, loadMore }) => {
    const containerRef = useRef(null);

    useEffect(() => {
      const handleScroll = () => {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        // Load more when within 500px of bottom
        if (distanceFromBottom < 500 && hasNext && !loadingMore) {
          loadMore();
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();

      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }, [hasNext, loadingMore, loadMore]);

    return (
      <div ref={containerRef} className="pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map((order, index) => {
            const isLastItem = index === orders.length - 1;
            const isDeleting = deletingOrderId === order.id;

            return (
              <div
                key={order.id}
                ref={isLastItem ? lastOrderElementRef : null}
                className={isDeleting ? 'card-deleting' : ''}
                style={{
                  transition: isDeleting ? 'all 0.3s ease-out' : 'none',
                }}
              >
                <OrderCard
                  order={order}
                  onDelete={onDelete}
                  onOpen={onOpen}
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  isDeleting={isDeleting}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - reverted to previous */}
      <header className="bg-black text-white shadow-xl rounded-b-3xl mb-6">
        <div className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-5xl font-bold mb-3 tracking-wide">Purchase Orders</h1>
          <p className="text-lg text-gray-300">Manage and track your purchase orders</p>
        </div>
      </header>

      {/* Search and Sort Bar - white, full width without overflow */}
      <div className="w-full bg-white shadow-md py-4 px-4 sm:px-6 mb-6">
        <div className="max-w-[98%] mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search orders..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full px-4 py-2.5 pl-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="flex gap-2">
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="id">Sort by ID</option>
                <option value="order_date">Sort by Date</option>
                <option value="total_price">Sort by Price</option>
                <option value="item_name">Sort by Name</option>
                <option value="status">Sort by Status</option>
              </select>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
                className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all duration-200 flex items-center justify-center min-w-[42px]"
                aria-label="Toggle sort order"
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    transform: filters.sortOrder === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)',
                    transition: 'transform 0.2s ease',
                    display: 'block',
                    marginRight: '0'
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[98%] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State with Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ padding: '8px' }}>
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-16 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No purchase orders found</h3>
            <p className="text-gray-600">Get started by creating your first purchase order.</p>
          </div>
        ) : (
          /* Card Grid - no container shadow */
          <CardGrid
            orders={orders}
            deletingOrderId={deletingOrderId}
            onDelete={handleDeleteClick}
            onOpen={handleOpenOrder}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
            lastOrderElementRef={lastOrderElementRef}
            hasNext={hasNext}
            loadingMore={loadingMore}
            loadMore={loadMore}
          />
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center items-center py-6 mt-4">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-gray-900 border-r-transparent"></div>
            <span className="ml-2 text-sm text-gray-600">Loading more...</span>
          </div>
        )}
      </div>

      {/* Slide Out Panel - always render for smooth animation */}
      {selectedOrder && (
        <SlideOutPanel
          order={selectedOrder}
          onClose={handleClosePanel}
          onDelete={handleDeleteFromPanel}
          isOpen={isPanelOpen}
        />
      )}

      {/* Delete Modal */}
      <DeleteModal
        order={deleteOrder}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isOpen={!!deleteOrder}
      />

      {/* Confirm Dialog for Sidebar Delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onConfirm={handleConfirmDeleteFromPanel}
        onCancel={() => setConfirmDelete(null)}
        title="Delete Purchase Order"
        message={`Are you sure you want to delete "${confirmDelete?.item_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Toast Notification - minimal white/black */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
