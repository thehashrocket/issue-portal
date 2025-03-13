'use client';

import { AgGridReact } from "ag-grid-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Link from "next/link";
import { Client } from "@prisma/client";
import { 
    CellStyleModule,
    GridReadyEvent, 
    ModuleRegistry,
    ClientSideRowModelModule,
    ValidationModule,
    RowSelectionModule,
    ColumnAutoSizeModule,
    TextFilterModule,
    NumberFilterModule,
    DateFilterModule,
    ICellRendererParams,
  } from 'ag-grid-community';
  
import { useCallback } from "react";
  
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

function ClientsTable({ clients }: { clients: Client[] }) {
    const columnDefs = [
        {
            field: 'name',
            headerName: 'Name',
            cellRenderer: (params: ICellRendererParams) => (
                <Link className="hover:underline" href={`/clients/${params.data.id}`}>
                    {params.value}
                </Link>
            ),
        },
        {
            field: '_count.issues',
            headerName: 'Active Issues',
        },
        {
            field: 'updatedAt',
            headerName: 'Last Updated',
            cellRenderer: (params: ICellRendererParams) => new Date(params.value).toLocaleDateString(),
        },
        {
            field: 'status',
            headerName: 'Status',
        },
    ]

    const onGridReady = useCallback((params: GridReadyEvent) => {
        params.api.sizeColumnsToFit();
      }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Clients</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="ag-theme-alpine h-[400px] w-full rounded shadow-sm overflow-hidden border border-gray-200">
                    <AgGridReact
                        rowData={clients}
                        columnDefs={columnDefs}
                        onGridReady={onGridReady}
                        defaultColDef={{
                            sortable: true,
                            filter: true,
                            resizable: true,
                        }}
                        pagination={false}
                        animateRows={true}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

export default ClientsTable;