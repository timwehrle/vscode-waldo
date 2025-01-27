import * as vscode from "vscode";
import { TimerService } from "../services/timerService";

export function showStatsCommand() {
  const time = TimerService.getActiveTime();
  const idleTime = TimerService.getIdleTime();
  vscode.window.showInformationMessage(
    `Total time tracked: ${TimerService.formatTime(time)}\n` +
      `Idle time: ${Math.floor(idleTime / 1000)}s`
  );
}
