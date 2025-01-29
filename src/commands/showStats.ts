import * as vscode from "vscode";
import { TimerService } from "../services/timerService";

export function showStatsCommand() {
  const time = TimerService.getStats().formattedTime;
  vscode.window.showInformationMessage(`Total time tracked: ${time}\n`);
}
