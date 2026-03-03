export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (number) => {
  if (number === null || number === undefined) return '0';
  
  return new Intl.NumberFormat('en-IN').format(number);
};

export const formatDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return new Date(date).toLocaleDateString('en-IN', defaultOptions);
};

export const formatDateTime = (date) => {
  if (!date) return '';
  
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0%';
  return `${Number(value).toFixed(1)}%`;
};

export const getDateRange = (range) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  let startDate = new Date();
  
  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(today.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setMonth(today.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate.setFullYear(today.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setDate(today.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
  };
};
