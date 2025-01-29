import * as vscode from "vscode";
import { startTimerCommand } from "./commands/startTimer";
import { stopTimerCommand } from "./commands/stopTimer";
import { SidebarProvider } from "./views/sidebar";
import { TimerService } from "./services/timerService";
import { resetTimerCommand } from "./commands/resetTimer";
import { showStatsCommand } from "./commands/showStats";

export function activate(context: vscode.ExtensionContext) {
  // Initialize the timer service
  TimerService.initialize(context);

  // Create the sidebar provider
  const sidebarProvider = new SidebarProvider(context);

  // Register the TreeDataProvider and commands
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "waldoTimerSidebar",
      sidebarProvider
    ),
    vscode.commands.registerCommand("waldo.showStats", showStatsCommand),
    vscode.commands.registerCommand("waldo.startTimer", () => {
      startTimerCommand();
      sidebarProvider.refresh();
    }),
    vscode.commands.registerCommand("waldo.stopTimer", () => {
      stopTimerCommand();
      sidebarProvider.refresh();
    }),
    vscode.commands.registerCommand("waldo.resetTimer", () => {
      resetTimerCommand();
      sidebarProvider.refresh();
    })
  );
}

export function deactivate() {
  TimerService.stopTimer();
}
