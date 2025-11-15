/**
 * Dashboard Widget Presets Seeding
 * 
 * Seeds the database with widget presets from the canonical registry.
 * This should be run once per environment to initialize widget configuration.
 */

import { db } from './db.js';
import { dashboardWidgetPresets } from '../shared/schema.js';
import { DASHBOARD_WIDGETS } from '../src/config/dashboardWidgets.js';

export async function seedDashboardWidgetPresets() {
  try {
    console.log('Seeding dashboard widget presets...');
    
    // Check if presets already exist
    const existingPresets = await db.select().from(dashboardWidgetPresets);
    
    if (existingPresets.length > 0) {
      console.log(`Dashboard widget presets already exist (${existingPresets.length} presets). Skipping seed.`);
      return { seeded: false, count: existingPresets.length };
    }

    // Transform registry widgets to database insert format
    const presetsToInsert = DASHBOARD_WIDGETS.map(widget => ({
      widgetId: widget.widgetId,
      widgetName: widget.widgetName,
      widgetDescription: widget.widgetDescription || null,
      category: widget.category,
      defaultVisibleForRoles: widget.defaultVisibleForRoles,
      defaultDisplayOrder: widget.defaultDisplayOrder,
      widgetSettings: null, // Future: per-widget configuration
      isActive: widget.isActive
    }));

    // Bulk insert all presets
    await db.insert(dashboardWidgetPresets).values(presetsToInsert);
    
    console.log(`Successfully seeded ${presetsToInsert.length} dashboard widget presets`);
    return { seeded: true, count: presetsToInsert.length };
  } catch (error) {
    console.error('Error seeding dashboard widget presets:', error);
    throw error;
  }
}
