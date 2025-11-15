import { useQuery } from '@tanstack/react-query';
import { ReactNode } from 'react';

export interface DashboardWidget {
  widgetId: string;
  widgetName: string;
  isVisible: boolean;
  displayOrder: number;
}

export interface DashboardWidgetsResponse {
  widgets: DashboardWidget[];
}

export function useDashboardWidgets(userId: string | undefined, userRole: string | undefined) {
  const { data, isLoading, error } = useQuery<DashboardWidgetsResponse>({
    queryKey: ['/api/dashboard/widgets', userId, userRole],
    queryFn: async () => {
      if (!userId || !userRole) throw new Error('User ID and role are required');
      const response = await fetch(`/api/dashboard/widgets?userId=${userId}&role=${userRole}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard widgets: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!userId && !!userRole,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    refetchOnWindowFocus: false
  });

  // Helper: Check if a widget should be visible
  const isWidgetVisible = (widgetId: string): boolean => {
    if (isLoading || !data) return true; // Show all while loading (graceful degradation)
    return data.widgets.some(w => w.widgetId === widgetId && w.isVisible);
  };

  // Helper: Render widget conditionally based on visibility
  const renderWidget = (widgetId: string, renderFn: () => ReactNode | null): ReactNode => {
    if (!isWidgetVisible(widgetId)) return null;
    return renderFn();
  };

  return {
    widgets: data?.widgets ?? [],
    isLoading,
    error,
    isWidgetVisible,
    renderWidget
  };
}
