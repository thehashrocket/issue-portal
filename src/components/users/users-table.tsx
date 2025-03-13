'use client';

import { useCallback, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowClickedEvent } from 'ag-grid-community';
import { User } from '@/types/user';
import { useRouter } from 'next/navigation';

import { 
  CellStyleModule,
  ModuleRegistry,
  ClientSideRowModelModule,
  ValidationModule,
  RowSelectionModule,
  ColumnAutoSizeModule,
  TextFilterModule,
  NumberFilterModule,
  RowStyleModule,
  DateFilterModule,
  PaginationModule,
} from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([
  CellStyleModule,
  ClientSideRowModelModule, 
  ValidationModule, 
  RowSelectionModule, 
  ColumnAutoSizeModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  PaginationModule,
  RowStyleModule,
]);

interface UsersTableProps {
  users: User[];
  isLoading?: boolean;
  error?: Error | null;
}

export function UsersTable({ users, isLoading, error }: UsersTableProps) {
  const router = useRouter();
  const [columnDefs] = useState<ColDef[]>([
    { 
      field: 'name', 
      headerName: 'Name', 
      flex: 1,
      valueGetter: (params) => params.data.name || 'N/A'
    },
    { field: 'email', headerName: 'Email', flex: 1 },
    { 
      field: 'role', 
      headerName: 'Role', 
      flex: 1,
      valueFormatter: (params) => params.value.toLowerCase()
    },
    { 
      field: 'createdAt', 
      headerName: 'Created At', 
      flex: 1,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    },
    { 
      field: 'updatedAt', 
      headerName: 'Updated At', 
      flex: 1,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    }
  ]);

  const defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  const onRowClicked = useCallback((event: RowClickedEvent) => {
    router.push(`/users/${event.data.id}`);
  }, [router]);

  if (error) {
    return (
      <div 
        role="alert"
        className="p-4 text-red-700 bg-red-100 rounded-lg"
      >
        <h3 className="font-medium">Error loading users</h3>
        <p className="mt-1">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        role="status"
        className="w-full h-[600px] animate-pulse"
        aria-label="Loading users table"
      >
        <div className="h-10 bg-gray-200 rounded-t-lg mb-4" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 mb-2 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div 
      className="ag-theme-alpine w-full h-[600px]"
      role="region"
      aria-label="Users table"
    >
      <AgGridReact
        rowData={users}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        animateRows={true}
        pagination={true}
        paginationPageSize={10}
        domLayout="autoHeight"
        suppressCellFocus={false}
        enableCellTextSelection={true}
        ensureDomOrder={true}
        onRowClicked={onRowClicked}
        rowClass="cursor-pointer hover:bg-gray-50"
      />
    </div>
  );
} 