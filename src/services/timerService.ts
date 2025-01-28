import * as vscode from "vscode";

export class TimerService {
  private static activeTime: number = 0;
  private static interval: NodeJS.Timeout | undefined;
  private static idleCheckInterval: NodeJS.Timeout | undefined;
  private static isTracking: boolean = false;
  private static lastActivity: number = Date.now();
  private static readonly IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private static readonly RESUME_PROMPT_COOLDOWN = 30000; // 30 seconds
  private static statusBarItem: vscode.StatusBarItem;
  private static context: vscode.ExtensionContext;
  private static lastResumePrompt: number = 0;
  private static isPromptPending: boolean = false;

  public static initialize(context: vscode.ExtensionContext) {
    this.context = context;
    this.activeTime = context.globalState.get("waldoActiveTime") || 0;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = "waldo.showStats";
    this.updateStatusBar();
    this.statusBarItem.show();

    // Restore timer state if it was running before
    const wasTracking = context.globalState.get("waldoIsTracking", false);
    if (wasTracking) {
      this.startTimer(false); // Start without notification
    }
  }

  public static startTimer(showNotification: boolean = true) {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;
    this.lastActivity = Date.now();
    this.context.globalState.update("waldoIsTracking", true);

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
        this.pauseTimer(true);
        vscode.window.showInformationMessage(
          "Waldo has paused tracking your time due to inactivity. Resume working to continue tracking."
        );
      }
    }, 30000); // Check every 30 seconds

    this.statusBarItem.show();
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

    this.clearIntervals();
    this.isTracking = false;
    this.context.globalState.update("waldoIsTracking", false);

    vscode.window.showInformationMessage(
      `Waldo has stopped tracking your time! You worked for ${this.formatTime(
        this.activeTime
      )}.`
    );
    this.updateStatusBar();
  }

  public static pauseTimer(showNotification: boolean = false) {
    if (!this.isTracking) {
      return;
    }

    this.clearIntervals();
    this.isTracking = false;
    this.context.globalState.update("waldoIsTracking", false);
    this.updateStatusBar();

    if (showNotification) {
      vscode.window.showInformationMessage(
        "Waldo has paused tracking your time due to inactivity. Resume working to continue tracking."
      );
    }
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

    if (
      !this.isTracking &&
      this.activeTime > 0 &&
      !this.isPromptPending &&
      Date.now() - this.lastResumePrompt > this.RESUME_PROMPT_COOLDOWN
    ) {
      this.isPromptPending = true;
      this.lastResumePrompt = Date.now();

      try {
        const userChoice = await vscode.window.showInformationMessage(
          "Waldo has detected activity. Do you want to resume the timer?",
          "Yes",
          "No"
        );

        if (userChoice === "Yes") {
          this.startTimer();
        }
      } finally {
        this.isPromptPending = false;
      }
    }
  }

  private static updateStatusBar() {
    const formattedTime = this.formatTime(this.activeTime);
    this.statusBarItem.text = `$(clock) ${formattedTime}`;
    this.statusBarItem.tooltip = this.isTracking
      ? `Time tracked: ${formattedTime} (Click for details)`
      : `Timer paused: ${formattedTime} (Click for details)`;
  }

  public static resetTimer() {
    this.activeTime = 0;
    this.context.globalState.update("waldoActiveTime", 0);
    this.context.globalState.update("waldoIsTracking", false);
    this.isTracking = false;
    this.clearIntervals();
    this.updateStatusBar();
    vscode.window.showInformationMessage("Waldo has reset the timer.");
  }

  public static getStats(): TimerStats {
    return {
      activeTime: this.activeTime,
      isTracking: this.isTracking,
      idleTime: this.getIdleTime(),
      formattedTime: this.formatTime(this.activeTime),
    };
  }

  public static getIdleTime(): number {
    return Date.now() - this.lastActivity;
  }

  private static formatTime(ms: number): string {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return [
      hours > 0 ? `${hours}h` : null,
      minutes > 0 || hours > 0 ? `${minutes}m` : null,
      `${seconds}s`,
    ]
      .filter(Boolean)
      .join(" ");
  }
}

interface TimerStats {
  activeTime: number;
  isTracking: boolean;
  idleTime: number;
  formattedTime: string;
}
