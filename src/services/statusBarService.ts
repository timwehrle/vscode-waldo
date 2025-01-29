import * as vscode from "vscode";
import { TimerService } from "./timerService";

export class StatusBarService {
  private static statusBarItem: vscode.StatusBarItem;

  public static initialize() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = "waldo.showStats";
    this.statusBarItem.show();
  }

  public static update(activeTime: number, isTracking: boolean) {
    this.statusBarItem.text = `$(clock) ${TimerService.formatTime(activeTime)}`;
    this.statusBarItem.tooltip = isTracking
      ? "Waldo is tracking."
      : "Waldo is paused.";
  }
}
