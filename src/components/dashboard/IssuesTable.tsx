'use client';

import { useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import Link from "next/link";
import { Issue } from "@prisma/client";
import PriorityBadgeRenderer from "../issues/PriorityBadgeRenderer";
import StatusBadgeRenderer from "../issues/StatusBadgeRenderer";
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

function IssuesTable({ issues }: { issues: Issue[] }) {
    const columnDefs = [
        {
            field: 'title',
            headerName: 'Title',
            cellRenderer: (params: ICellRendererParams) => (
                <Link className="hover:underline" href={`/issues/${params.data.id}`}>
                    {params.value}
                </Link>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            cellRenderer: StatusBadgeRenderer,
        },
        {
            field: 'priority',
            headerName: 'Priority',
            cellRenderer: PriorityBadgeRenderer,
        },
        {
            field: 'client.name',
            headerName: 'Client',
            cellRenderer: (params: ICellRendererParams) => (
                <Link className="hover:underline" href={`/clients/${params.data.client.id}`}>
                    {params.value}
                </Link>
            ),
        },
        {
            field: 'dueDate',
            headerName: 'Due Date',
            cellRenderer: (params: ICellRendererParams) =>
                params.value ? new Date(params.value).toLocaleDateString() : 'No due date',
        },
    ]

    const onGridReady = useCallback((params: GridReadyEvent) => {
        params.api.sizeColumnsToFit();
      }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Active Issues</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="ag-theme-alpine h-[400px] w-full rounded shadow-sm overflow-hidden border border-gray-200">
                    <AgGridReact
                        rowData={issues}
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

export default IssuesTable;