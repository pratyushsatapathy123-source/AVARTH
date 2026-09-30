/**
 * AVARTH Alert Management Service
 */

import { AlertItem } from '../models/types.ts';
import { DEMO_ALERTS } from '../data/demoData.ts';
import { logEvent } from '../utils/logger.ts';

class AlertService {
  private alerts: AlertItem[] = [];

  constructor() {
    this.alerts = JSON.parse(JSON.stringify(DEMO_ALERTS));
  }

  public getAlerts(): AlertItem[] {
    return [...this.alerts];
  }

  public getAlertById(id: string): AlertItem | undefined {
    return this.alerts.find(a => a.id === id);
  }

  public createAlert(newAlert: Omit<AlertItem, 'id' | 'timestamp'> & { timestamp?: string }): AlertItem {
    const id = `ALT-OD-${String(this.alerts.length + 1).padStart(2, '0')}`;
    const timestamp =
      newAlert.timestamp ||
      new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST';

    const item: AlertItem = {
      ...newAlert,
      id,
      timestamp,
    };

    this.alerts.unshift(item);
    logEvent('Alert created', { id, severity: item.severity });
    return item;
  }

  public updateAlert(id: string, patch: Partial<AlertItem>): AlertItem | undefined {
    const idx = this.alerts.findIndex(a => a.id === id);
    if (idx === -1) return undefined;

    this.alerts[idx] = {
      ...this.alerts[idx],
      ...patch,
    };

    logEvent('Alert updated', { id, status: this.alerts[idx].status });
    return this.alerts[idx];
  }
}

export const alertService = new AlertService();
