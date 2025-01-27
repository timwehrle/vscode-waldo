import * as vscode from "vscode";
import { startTimerCommand } from "./commands/startTimer";
import { stopTimerCommand } from "./commands/stopTimer";
import { SidebarProvider } from "./views/sidebar";
import { TimerService } from "./services/timerService";
import { resetTimerCommand } from "./commands/resetTimer";
import { showStatsCommand } from "./commands/showStats";

export function activate(context: vscode.ExtensionContext) {
  TimerService.initialize(context);

  // Create and register the sidebar provider
  const sidebarProvider = new SidebarProvider(context);

  // Track activity across different events
  const activityEvents = [
    vscode.window.onDidChangeTextEditorSelection,
    vscode.workspace.onDidChangeTextDocument,
    vscode.window.onDidChangeActiveTextEditor,
    vscode.window.onDidChangeWindowState,
    vscode.workspace.onDidSaveTextDocument,
  ];

  activityEvents.forEach((event) => {
    context.subscriptions.push(
      event(() => {
        TimerService.updateLastActivity();
      })
    );
  });

  // Register providers and commands
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("waldo.sidebar", sidebarProvider),
    vscode.commands.registerCommand("waldo.showStats", showStatsCommand),
    vscode.commands.registerCommand("waldo.startTimer", startTimerCommand),
    vscode.commands.registerCommand("waldo.stopTimer", stopTimerCommand),
    vscode.commands.registerCommand("waldo.resetTimer", resetTimerCommand)
  );
}

export function deactivate() {
  TimerService.stopTimer();
}
