'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IssueStatus, IssuePriority, Issue as PrismaIssue, User } from '@prisma/client';
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

// Import AG Grid styles
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

// Constants
const ITEMS_PER_PAGE = 10;

// Extended Issue type to include user relations
type ExtendedIssue = PrismaIssue & {
  reportedBy: Pick<User, 'id' | 'name' | 'email'>;
  assignedTo?: Pick<User, 'id' | 'name' | 'email'> | null;
  client?: {
    id: string;
    name: string;
  } | null;
};

export default function IssueList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [issues, setIssues] = useState<ExtendedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  // Fetch issues data
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const assignedToId = searchParams.get('assignedToId') || '';
    
    setCurrentPage(page);
    
    async function fetchIssues() {
      setLoading(true);
      try {
        // Build query params
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', ITEMS_PER_PAGE.toString());
        
        if (status) params.append('status', status);
        if (priority) params.append('priority', priority);
        if (assignedToId) params.append('assignedToId', assignedToId);
        
        const response = await fetch(`/api/issues?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch issues');
        }
        
        const data = await response.json();
        setIssues(data.data.issues);
        
        // Get pagination information
        const total = data.data.pagination.total;
        const totalPages = data.data.pagination.totalPages;
        setTotalPages(totalPages || 1);
        setTotalRows(total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchIssues();
  }, [searchParams]);

  // Handle page change
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/issues?${params.toString()}`);
  };

  // Title cell renderer
  const TitleRenderer = (params: ICellRendererParams) => {
    const title = params.value;
    return (
      <div className="flex items-center h-full">
        {title}
      </div>
    );
  };

  // Status badge cell renderer
  const StatusBadgeRenderer = (params: ICellRendererParams) => {
    const status = params.value as IssueStatus;
    
    const getStatusColor = () => {
      switch (status) {
        case IssueStatus.NEW:
          return 'bg-blue-100 text-blue-800';
        case IssueStatus.ASSIGNED:
          return 'bg-purple-100 text-purple-800';
        case IssueStatus.IN_PROGRESS:
          return 'bg-yellow-100 text-yellow-800';
        case IssueStatus.PENDING:
          return 'bg-orange-100 text-orange-800';
        case IssueStatus.NEEDS_REVIEW:
          return 'bg-indigo-100 text-indigo-800';
        case IssueStatus.FIXED:
          return 'bg-green-100 text-green-800';
        case IssueStatus.CLOSED:
          return 'bg-gray-100 text-gray-800';
        case IssueStatus.WONT_FIX:
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="flex items-center h-full">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
          {status.replace('_', ' ')}
        </span>
      </div>
    );
  };

  // Priority badge cell renderer
  const PriorityBadgeRenderer = (params: ICellRendererParams) => {
    const priority = params.value as IssuePriority;
    
    const getPriorityColor = () => {
      switch (priority) {
        case IssuePriority.LOW:
          return 'bg-gray-100 text-gray-800';
        case IssuePriority.MEDIUM:
          return 'bg-blue-100 text-blue-800';
        case IssuePriority.HIGH:
          return 'bg-orange-100 text-orange-800';
        case IssuePriority.CRITICAL:
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="flex items-center h-full">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor()}`}>
          {priority}
        </span>
      </div>
    );
  };

  // User cell renderer
  const UserRenderer = (params: ICellRendererParams) => {
    const user = params.value;
    return (
      <div className="flex items-center h-full">
        {user ? (user.name || user.email) : 'Unassigned'}
      </div>
    );
  };

  // Client cell renderer
  const ClientRenderer = (params: ICellRendererParams) => {
    const client = params.value;
    return (
      <div className="flex items-center h-full">
        {client ? client.name : 'N/A'}
      </div>
    );
  };

  // Actions cell renderer
  const ActionsRenderer = (params: ICellRendererParams) => {
    const issueId = params.data.id;
    
    return (
      <div className="flex items-center justify-end space-x-4 h-full">
        <Link 
          href={`/issues/${issueId}`} 
          className="text-blue-600 hover:text-blue-900"
        >
          View
        </Link>
        <Link 
          href={`/issues/${issueId}/edit`} 
          className="text-indigo-600 hover:text-indigo-900"
        >
          Edit
        </Link>
      </div>
    );
  };

  // Date formatter with cell renderer
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
      headerName: 'Title', 
      field: 'title', 
      cellRenderer: TitleRenderer,
      filter: true,
      sortable: true,
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
      headerName: 'Priority', 
      field: 'priority', 
      cellRenderer: PriorityBadgeRenderer,
      filter: true,
      sortable: true,
      width: 120
    },
    { 
      headerName: 'Client', 
      field: 'client',
      cellRenderer: ClientRenderer,
      minWidth: 150,
      flex: 1
    },
    { 
      headerName: 'Reported By', 
      field: 'reportedBy',
      cellRenderer: UserRenderer,
      minWidth: 150,
      flex: 1
    },
    { 
      headerName: 'Assigned To', 
      field: 'assignedTo',
      cellRenderer: UserRenderer,
      minWidth: 150,
      flex: 1
    },
    { 
      headerName: 'Created', 
      field: 'createdAt', 
      cellRenderer: DateCellRenderer,
      sortable: true,
      width: 120
    },
    { 
      headerName: 'Due Date', 
      field: 'dueDate', 
      cellRenderer: DateCellRenderer,
      sortable: true,
      width: 120
    },
    { 
      headerName: 'Actions', 
      cellRenderer: ActionsRenderer,
      width: 120,
      sortable: false,
      filter: false
    }
  ], []);

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

  if (loading && issues.length === 0) {
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
        <h1 className="text-2xl font-bold">Issues</h1>
        <Link href="/issues/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Issue
        </Link>
      </div>

      {issues.length === 0 && !loading ? (
        <div className="bg-white shadow rounded p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 mb-4">No issues found.</p>
          <Link 
            href="/issues/new" 
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Issue
          </Link>
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
              rowData={issues}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              pagination={false} // Using custom pagination with server-side
              rowSelection="single"
              animateRows={true}
              enableCellTextSelection={true}
              onRowClicked={(event) => router.push(`/issues/${event.data.id}`)}
              rowModelType="clientSide"
              theme="legacy"
              overlayLoadingTemplate={
                '<span class="ag-overlay-loading-center">Please wait while your issues are loading</span>'
              }
              overlayNoRowsTemplate={
                '<span class="ag-overlay-no-rows-center">No issues found matching your search criteria</span>'
              }
            />
          </div>
          
          {/* Custom Pagination */}
          <div className="flex justify-between items-center mt-4 bg-white p-4 rounded shadow-sm">
            <div className="text-sm text-gray-500">
              Showing {issues.length} of {totalRows} issues
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