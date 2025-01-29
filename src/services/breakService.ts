import * as vscode from "vscode";
import { TimerService } from "./timerService";

export class BreakService {
  private static readonly BREAK_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private static readonly BREAK_DURATION = 5 * 60 * 1000; // 5 minutes
  public static isOnBreak: boolean = false;

  public static shouldStartBreak(activeTime: number): boolean {
    return activeTime % this.BREAK_INTERVAL === 0 && !this.isOnBreak;
  }

  public static startBreak() {
    this.isOnBreak = true;
    vscode.window.showInformationMessage(
      `Time for a break! Take a ${this.BREAK_DURATION / 60000} minute break.`
    );
    setTimeout(() => this.endBreak(), this.BREAK_DURATION);
  }

  public static endBreak() {
    this.isOnBreak = false;
    TimerService.startTimer();
    vscode.window.showInformationMessage(
      "Break is over! Time to get back to work."
    );
  }
}
