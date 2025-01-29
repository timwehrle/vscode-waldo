import * as vscode from "vscode";
import { TimerService } from "./timerService";

export class ActivityMonitorService {
  private static idleTimeout = 5 * 60 * 1000; // 5 minutes
  private static lastActivity = Date.now();
  private static interval: NodeJS.Timeout | undefined;

  public static startMonitoring() {
    this.interval = setInterval(() => {
      if (Date.now() - this.lastActivity > this.idleTimeout) {
        TimerService.stopTimer();
        vscode.window.showInformationMessage("Waldo paused due to inactivity.");
      }
    }, 30000);
  }

  public static stopMonitoring() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}
