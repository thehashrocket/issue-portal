'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Client, ClientStatus } from '@prisma/client';
import Link from 'next/link';

// Define the User type for account managers
type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
};

interface ClientFormProps {
  clientId?: string;
  initialData?: Partial<Client>;
}

export default function ClientForm({ clientId, initialData }: ClientFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const isEditMode = !!clientId;
  
  // Form state
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    description: '',
    primaryContact: '',
    sla: '',
    notes: '',
    status: ClientStatus.ACTIVE,
    managerId: session?.user?.id || null,
    ...initialData,
  });
  
  // Form state management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountManagers, setAccountManagers] = useState<User[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Check if user has permission to edit clients
  const canEditClients = !!session?.user?.role && 
    ['ADMIN', 'ACCOUNT_MANAGER'].includes(session.user.role as string);

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (session && !canEditClients) {
      router.push('/clients');
    }
  }, [session, canEditClients, router]);

  // Fetch account managers for the dropdown
  useEffect(() => {
    async function fetchAccountManagers() {
      try {
        const response = await fetch('/api/users?role=ACCOUNT_MANAGER');
        if (!response.ok) {
          throw new Error('Failed to fetch account managers');
        }
        const data = await response.json();
        setAccountManagers(data.data);
      } catch (err) {
        console.error('Error fetching account managers:', err);
      }
    }

    if (session?.user?.role === 'ADMIN') {
      fetchAccountManagers();
    }
  }, [session]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate form data
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (formData.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(formData.phone)) {
      errors.phone = 'Invalid phone number format';
    }
    
    if (formData.website && !/^https?:\/\/\S+\.\S+/.test(formData.website)) {
      errors.website = 'Website must be a valid URL (starting with http:// or https://)';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const url = isEditMode ? `/api/clients/${clientId}` : '/api/clients';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save client');
      }
      
      await response.json();
      
      setSuccess(isEditMode ? 'Client updated successfully' : 'Client created successfully');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(isEditMode ? `/clients/${clientId}` : '/clients');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!canEditClients) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Client' : 'Add New Client'}</h1>
        <p className="text-gray-600 mt-1">
          {isEditMode ? 'Update client information' : 'Create a new client record'}
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              required
              aria-invalid={!!validationErrors.name}
              aria-describedby={validationErrors.name ? "name-error" : undefined}
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600" id="name-error">{validationErrors.name}</p>
            )}
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? "email-error" : undefined}
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600" id="email-error">{validationErrors.email}</p>
            )}
          </div>
          
          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!validationErrors.phone}
              aria-describedby={validationErrors.phone ? "phone-error" : undefined}
            />
            {validationErrors.phone && (
              <p className="mt-1 text-sm text-red-600" id="phone-error">{validationErrors.phone}</p>
            )}
          </div>
          
          {/* Address */}
          <div className="col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              placeholder="https://example.com"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.website ? 'border-red-500' : 'border-gray-300'
              }`}
              aria-invalid={!!validationErrors.website}
              aria-describedby={validationErrors.website ? "website-error" : undefined}
            />
            {validationErrors.website && (
              <p className="mt-1 text-sm text-red-600" id="website-error">{validationErrors.website}</p>
            )}
          </div>
          
          {/* Primary Contact */}
          <div>
            <label htmlFor="primaryContact" className="block text-sm font-medium text-gray-700 mb-1">
              Primary Contact
            </label>
            <input
              type="text"
              id="primaryContact"
              name="primaryContact"
              value={formData.primaryContact || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status || ClientStatus.ACTIVE}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={ClientStatus.ACTIVE}>Active</option>
              <option value={ClientStatus.INACTIVE}>Inactive</option>
              <option value={ClientStatus.LEAD}>Lead</option>
              <option value={ClientStatus.FORMER}>Former</option>
            </select>
          </div>
          
          {/* Account Manager */}
          <div>
            <label htmlFor="managerId" className="block text-sm font-medium text-gray-700 mb-1">
              Account Manager
            </label>
            <select
              id="managerId"
              name="managerId"
              value={formData.managerId || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Account Manager</option>
              {session?.user?.role === 'ADMIN' ? (
                accountManagers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name || manager.email}
                  </option>
                ))
              ) : (
                <option value={session?.user?.id || ''}>
                  {session?.user?.name || session?.user?.email}
                </option>
              )}
            </select>
          </div>
          
          {/* SLA */}
          <div>
            <label htmlFor="sla" className="block text-sm font-medium text-gray-700 mb-1">
              SLA
            </label>
            <input
              type="text"
              id="sla"
              name="sla"
              value={formData.sla || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Description */}
          <div className="col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Notes */}
          <div className="col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-8 flex justify-end space-x-3">
          <Link
            href={isEditMode ? `/clients/${clientId}` : '/clients'}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Client'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 