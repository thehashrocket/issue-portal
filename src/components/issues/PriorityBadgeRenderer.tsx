import { IssuePriority } from "@prisma/client";
import { ICellRendererParams } from "ag-grid-community";

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

  export default PriorityBadgeRenderer;