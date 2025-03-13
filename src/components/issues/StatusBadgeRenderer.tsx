import { IssueStatus } from "@prisma/client";
import { ICellRendererParams } from "ag-grid-community";

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

  export default StatusBadgeRenderer