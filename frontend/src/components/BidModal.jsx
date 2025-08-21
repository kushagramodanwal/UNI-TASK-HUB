import { useState } from 'react';

const BidModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  task, 
  existingBid = null,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    amount: existingBid?.amount || '',
    proposal: existingBid?.proposal || '',
    deliveryTime: existingBid?.deliveryTime || 7,
    phone: existingBid?.freelancerPhone || ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than ₹0';
    }

    if (!formData.proposal || formData.proposal.trim().length < 10) {
      newErrors.proposal = 'Proposal must be at least 10 characters';
    }

    if (formData.proposal && formData.proposal.length > 1000) {
      newErrors.proposal = 'Proposal cannot exceed 1000 characters';
    }

    if (!formData.deliveryTime || formData.deliveryTime < 1 || formData.deliveryTime > 365) {
      newErrors.deliveryTime = 'Delivery time must be between 1 and 365 days';
    }

    if (formData.phone && (formData.phone.length < 10 || formData.phone.length > 15)) {
      newErrors.phone = 'Phone number must be between 10 and 15 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const bidData = {
      taskId: task._id,
      amount: parseFloat(formData.amount),
      proposal: formData.proposal.trim(),
      deliveryTime: parseInt(formData.deliveryTime),
      phone: formData.phone.trim()
    };

    onSubmit(bidData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {existingBid ? 'Edit Bid' : 'Submit Your Bid'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Task Summary */}
        <div className="p-6 border-b border-gray-700 bg-gray-800">
          <h3 className="text-lg font-semibold text-white mb-2">{task.title}</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <span>Budget: ₹{task.budget}</span>
            <span>•</span>
            <span>Category: {task.category}</span>
            <span>•</span>
            <span>Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
          </div>
          <p className="text-gray-300 text-sm mt-3 line-clamp-3">
            {task.description}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Bid Amount */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">
                              Bid Amount (INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className={`w-full pl-8 pr-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter your bid amount"
                disabled={isLoading}
              />
            </div>
            {errors.amount && (
              <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
            )}
            {formData.amount && (
              <p className="text-gray-400 text-sm mt-1">
                              Service fee (5%): ₹{(formData.amount * 0.05).toFixed(2)} |
              You'll receive: ₹{(formData.amount * 0.95).toFixed(2)}
              </p>
            )}
          </div>

          {/* Delivery Time */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">
              Delivery Time *
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="1"
                max="365"
                value={formData.deliveryTime}
                onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                className={`w-24 px-3 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                  errors.deliveryTime ? 'border-red-500' : 'border-gray-600'
                }`}
                disabled={isLoading}
              />
              <span className="text-gray-400">
                {formData.deliveryTime == 1 ? 'day' : 'days'}
              </span>
            </div>
            {errors.deliveryTime && (
              <p className="text-red-400 text-sm mt-1">{errors.deliveryTime}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter your phone number"
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
            )}
            <p className="text-gray-400 text-sm mt-1">
              Your phone will only be revealed if your bid is accepted
            </p>
          </div>

          {/* Proposal */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">
              Proposal *
            </label>
            <textarea
              value={formData.proposal}
              onChange={(e) => handleInputChange('proposal', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none ${
                errors.proposal ? 'border-red-500' : 'border-gray-600'
              }`}
              rows="6"
              placeholder="Describe your approach, experience, and why you're the best fit for this task..."
              disabled={isLoading}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.proposal ? (
                <p className="text-red-400 text-sm">{errors.proposal}</p>
              ) : (
                <p className="text-gray-400 text-sm">
                  Minimum 10 characters, maximum 1000 characters
                </p>
              )}
              <p className="text-gray-400 text-sm">
                {formData.proposal.length}/1000
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Submitting...' : (existingBid ? 'Update Bid' : 'Submit Bid')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BidModal;
