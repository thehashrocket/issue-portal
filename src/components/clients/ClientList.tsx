'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Client, ClientStatus } from '@prisma/client';
import { AgGridReact } from 'ag-grid-react';
import { 
  CellStyleModule,
  ColDef, 
  GridReadyEvent, 
  ICellRendererParams,
  ModuleRegistry,
  ClientSideRowModelModule,
  ValidationModule,
  RowSelectionModule,
  ColumnAutoSizeModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule
} from 'ag-grid-community';

// Import AG Grid styles for the new Theming API
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([
  CellStyleModule,
  ClientSideRowModelModule, 
  ValidationModule, 
  RowSelectionModule, 
  ColumnAutoSizeModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule
]);

// Extended Client type with manager relation
type ExtendedClient = Client & {
  manager?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

export default function ClientList() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [clients, setClients] = useState<ExtendedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const pageSize = 10;

  // Check if user has permission to edit clients
  const canEditClients = !!session?.user?.role && 
    ['ADMIN', 'ACCOUNT_MANAGER'].includes(session.user.role as string);

  // Fetch clients data
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    
    setCurrentPage(page);
    
    async function fetchClients() {
      setLoading(true);
      try {
        // Build query params
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('pageSize', pageSize.toString());
        
        if (status) params.append('status', status);
        if (search) params.append('search', search);
        
        const response = await fetch(`/api/clients?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }
        
        const data = await response.json();
        setClients(data.data);
        
        // Get pagination information from headers
        const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');
        const totalPages = parseInt(response.headers.get('X-Total-Pages') || '1');
        setTotalPages(totalPages || 1);
        setTotalRows(totalCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchClients();
  }, [searchParams, pageSize]);

  // Handle page change
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/clients?${params.toString()}`);
  };

  // Status badge component for ag-Grid cell renderer
  const StatusBadgeRenderer = (params: ICellRendererParams) => {
    const status = params.value as ClientStatus;
    
    const getStatusColor = () => {
      switch (status) {
        case 'ACTIVE':
          return 'bg-green-100 text-green-800';
        case 'INACTIVE':
          return 'bg-gray-100 text-gray-800';
        case 'LEAD':
          return 'bg-blue-100 text-blue-800';
        case 'FORMER':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="flex items-center h-full">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
          {status.toLowerCase().replace('_', ' ')}
        </span>
      </div>
    );
  };

  // Actions cell renderer
  const ActionsRenderer = (params: ICellRendererParams) => {
    const clientId = params.data.id;
    
    return (
      <div className="flex items-center justify-end space-x-4 h-full">
        <Link 
          href={`/clients/${clientId}`} 
          className="text-blue-600 hover:text-blue-900"
        >
          View
        </Link>
        {canEditClients && (
          <Link 
            href={`/clients/${clientId}/edit`} 
            className="text-indigo-600 hover:text-indigo-900"
          >
            Edit
          </Link>
        )}
      </div>
    );
  };

  // Manager cell renderer
  const ManagerRenderer = (params: ICellRendererParams) => {
    const manager = params.data.manager;
    return (
      <div className="flex items-center h-full">
        {manager ? (manager.name || manager.email) : 'Unassigned'}
      </div>
    );
  };

  // Contact cell renderer
  const ContactRenderer = (params: ICellRendererParams) => {
    return (
      <div className="flex flex-col justify-center h-full">
        <div>{params.data.email || 'N/A'} {params.data.phone || 'N/A'}</div>
      </div>
    );
  };

  // Date cell renderer
  const DateCellRenderer = (params: ICellRendererParams) => {
    const date = params.value ? new Date(params.value).toLocaleDateString() : '';
    return (
      <div className="flex items-center h-full">
        {date}
      </div>
    );
  };

  // Define column definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    { 
      headerName: 'Name', 
      field: 'name', 
      filter: true,
      sortable: true,
      minWidth: 200,
      flex: 1,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex items-center h-full">
          {params.value}
        </div>
      )
    },
    { 
      headerName: 'Contact', 
      cellRenderer: ContactRenderer,
      minWidth: 200,
      flex: 1
    },
    { 
      headerName: 'Status', 
      field: 'status', 
      cellRenderer: StatusBadgeRenderer,
      filter: true,
      sortable: true,
      width: 120
    },
    { 
      headerName: 'Account Manager', 
      cellRenderer: ManagerRenderer,
      minWidth: 150,
      flex: 1
    },
    { 
      headerName: 'Last Updated', 
      field: 'updatedAt', 
      cellRenderer: DateCellRenderer,
      sortable: true,
      width: 150
    },
    { 
      headerName: 'Actions', 
      cellRenderer: ActionsRenderer,
      width: 120,
      sortable: false,
      filter: false
    }
  ], [canEditClients]);

  // Default column definitions
  const defaultColDef = useMemo(() => ({
    resizable: true,
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      height: '100%'
    }
  }), []);

  // Grid ready handler
  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  if (loading && clients.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-sm max-w-md">
          <p className="font-medium">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-medium py-1 px-3 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        {canEditClients && (
          <Link href="/clients/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Client
          </Link>
        )}
      </div>

      {clients.length === 0 && !loading ? (
        <div className="bg-white shadow rounded p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 mb-4">No clients found.</p>
          {canEditClients && (
            <Link 
              href="/clients/new" 
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Client
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          
          {/* Loading overlay */}
          {loading && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mr-2" />
              <span className="text-gray-600 font-medium">Loading...</span>
            </div>
          )}
          
          {/* AG Grid */}
          <div className="ag-theme-alpine w-full h-[600px] rounded shadow-sm overflow-hidden border border-gray-200">
            <AgGridReact
              rowData={clients}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              pagination={false} // Using custom pagination with server-side
              rowSelection="single"
              animateRows={true}
              enableCellTextSelection={true}
              onRowClicked={(event) => router.push(`/clients/${event.data.id}`)}
              rowModelType="clientSide"
              theme="legacy"
              overlayLoadingTemplate={
                '<span class="ag-overlay-loading-center">Please wait while your clients are loading</span>'
              }
              overlayNoRowsTemplate={
                '<span class="ag-overlay-no-rows-center">No clients found matching your search criteria</span>'
              }
            />
          </div>
          
          {/* Custom Pagination */}
          <div className="flex justify-between items-center mt-4 bg-white p-4 rounded shadow-sm">
            <div className="text-sm text-gray-500">
              Showing {clients.length} of {totalRows} clients
            </div>
            
            <nav className="flex items-center space-x-2" aria-label="Pagination">
              <button
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded flex items-center ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100 transition-colors'
                }`}
                aria-label="Previous page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <span className="px-3 py-1 text-gray-700 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded flex items-center ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100 transition-colors'
                }`}
                aria-label="Next page"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
} 