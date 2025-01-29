import * as vscode from "vscode";
import { BreakService } from "./breakService";
import { ActivityMonitorService } from "./activityMonitorService";
import { StatusBarService } from "./statusBarService";

export class TimerService {
  private static activeTime: number = 0;
  private static interval: NodeJS.Timeout | undefined;
  private static isTracking: boolean = false;
  private static context: vscode.ExtensionContext;

  public static initialize(context: vscode.ExtensionContext) {
    this.context = context;
    this.activeTime = context.globalState.get("waldoActiveTime") || 0;
    StatusBarService.initialize();

    if (context.globalState.get("waldoIsTracking", false)) {
      this.startTimer(false);
    }
  }

  public static startTimer(showNotification: boolean = true) {
    if (this.isTracking) {
      return;
    }
    this.isTracking = true;
    this.context.globalState.update("waldoIsTracking", true);

    this.interval = setInterval(() => {
      this.activeTime += 1000;
      StatusBarService.update(this.activeTime, this.isTracking);
      this.context.globalState.update("waldoActiveTime", this.activeTime);

      if (BreakService.shouldStartBreak(this.activeTime)) {
        BreakService.startBreak();
      }
    }, 1000);

    ActivityMonitorService.startMonitoring();
    if (showNotification) {
      vscode.window.showInformationMessage(
        "Waldo has started tracking your time."
      );
    }
  }

  public static stopTimer() {
    if (!this.isTracking) {
      return;
    }
    this.clearInterval();
    this.isTracking = false;
    this.context.globalState.update("waldoIsTracking", false);
    StatusBarService.update(this.activeTime, this.isTracking);
    vscode.window.showInformationMessage(
      `Waldo stopped tracking! You worked for ${this.formatTime(
        this.activeTime
      )}.`
    );
  }

  public static resetTimer() {
    this.activeTime = 0;
    this.context.globalState.update("waldoActiveTime", 0);
    this.clearInterval();
    this.isTracking = false;
    this.context.globalState.update("waldoIsTracking", false);
    StatusBarService.update(this.activeTime, this.isTracking);
    vscode.window.showInformationMessage("Waldo has reset the tracker.");
  }

  public static clearInterval() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    ActivityMonitorService.stopMonitoring();
  }

  public static formatTime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  public static getStats() {
    return {
      formattedTime: this.formatTime(this.activeTime),
      activeTime: this.activeTime,
      isTracking: this.isTracking,
    };
  }
}
