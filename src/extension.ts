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

  // Register the TreeDataProvider and commands
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "waldoTimerSidebar",
      sidebarProvider
    ),
    vscode.commands.registerCommand("waldo.showStats", showStatsCommand),
    vscode.commands.registerCommand("waldo.startTimer", () => {
      startTimerCommand();
      sidebarProvider.refresh(); // Refresh the tree view after starting timer
    }),
    vscode.commands.registerCommand("waldo.stopTimer", () => {
      stopTimerCommand();
      sidebarProvider.refresh(); // Refresh the tree view after stopping timer
    }),
    vscode.commands.registerCommand("waldo.resetTimer", () => {
      resetTimerCommand();
      sidebarProvider.refresh(); // Refresh the tree view after resetting timer
    })
  );
}

export function deactivate() {
  TimerService.stopTimer();
}
