import * as vscode from "vscode";

export class TimerService {
  private static activeTime: number = 0;
  private static interval: NodeJS.Timeout | undefined;
  private static idleCheckInterval: NodeJS.Timeout | undefined;
  private static isTracking: boolean = false;
  private static lastActivity: number = Date.now();
  private static readonly IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private static statusBarItem: vscode.StatusBarItem;
  private static context: vscode.ExtensionContext;

  public static initialize(context: vscode.ExtensionContext) {
    this.context = context;
    this.activeTime = context.globalState.get("waldoActiveTime") || 0;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right
    );
    this.statusBarItem.command = "waldo.showStats";
    this.updateStatusBar();
    this.statusBarItem.show();
  }

  public static startTimer() {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;
    this.lastActivity = Date.now();

    // Main timer interval
    this.interval = setInterval(() => {
      this.activeTime += 1000;
      this.updateStatusBar();
      this.context.globalState.update("waldoActiveTime", this.activeTime);
    }, 1000);

    // Idle check interval
    this.idleCheckInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivity;
      if (timeSinceLastActivity > this.IDLE_TIMEOUT) {
        this.pauseTimer();
        vscode.window.showInformationMessage(
          "Waldo has paused tracking your time due to inactivity. Resume working to continue tracking."
        );
      }
    }, 30000); // Check every 30 seconds

    this.statusBarItem.show();
    vscode.window.showInformationMessage(
      "Waldo has started tracking your time."
    );
  }

  public static stopTimer() {
    if (!this.isTracking) {
      return;
    }

    this.clearIntervals();
    this.isTracking = false;

    vscode.window.showInformationMessage(
      `Waldo has stopped tracking your time! ${this.formatTime(
        this.activeTime
      )}`
    );
    this.updateStatusBar();
  }

  public static pauseTimer() {
    if (!this.isTracking) {
      return;
    }

    this.clearIntervals();
    this.isTracking = false;
    this.updateStatusBar();
  }

  private static clearIntervals() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = undefined;
    }
  }

  public static async updateLastActivity() {
    this.lastActivity = Date.now();
    if (!this.isTracking && this.activeTime > 0) {
      // Ask the user if they want to resume tracking
      const userChoice = await vscode.window.showInformationMessage(
        "Waldo has detected activity. Do you want to resume the timer?",
        "Yes",
        "No"
      );

      if (userChoice === "Yes") {
        this.startTimer();
        vscode.window.showInformationMessage("Waldo has resumed tracking.");
      } else {
        vscode.window.showInformationMessage("Waldo keeps the timer stopped.");
      }
    }
  }

  private static updateStatusBar() {
    this.statusBarItem.text = `$(clock) ${this.formatTime(this.activeTime)}`;
    this.statusBarItem.tooltip = this.isTracking
      ? "Time tracked (Click for details)"
      : "Timer paused (Click for details)";
  }

  public static resetTimer() {
    this.activeTime = 0;
    this.context.globalState.update("waldoActiveTime", 0);
    this.updateStatusBar();
    vscode.window.showInformationMessage("Waldo has reset the timer.");
  }

  public static getActiveTime(): number {
    return this.activeTime;
  }

  public static isTimerRunning(): boolean {
    return this.isTracking;
  }

  public static getTodayStats(): string {
    return this.formatTime(this.activeTime);
  }

  public static getIdleTime(): number {
    return Date.now() - this.lastActivity;
  }

  public static formatTime(ms: number): string {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const parts = [];
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0 || hours > 0) {
      parts.push(`${minutes}m`);
    }
    parts.push(`${seconds}s`);

    return parts.join(" ");
  }
}
