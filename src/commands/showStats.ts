import * as vscode from "vscode";
import { TimerService } from "../services/timerService";

export function showStatsCommand() {
  const time = TimerService.getStats().formattedTime;
  const idleTime = TimerService.getIdleTime();
  vscode.window.showInformationMessage(
    `Total time tracked: ${time}\n` +
      `Idle time: ${Math.floor(idleTime / 1000)}s`
  );
}
