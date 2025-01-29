import * as vscode from "vscode";
import { TimerService } from "../services/timerService";
import { BreakService } from "../services/breakService";

export class SidebarProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private updateInterval: NodeJS.Timeout | undefined;
  private view: vscode.TreeView<TreeItem> | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {
    // Register the tree data provider
    this.view = vscode.window.createTreeView("waldoTimerSidebar", {
      treeDataProvider: this,
      showCollapseAll: false,
    });

    // Set initial context and start updates
    this.updateContext();
    this.startUpdatingTime();
  }

  private updateContext() {
    const stats = TimerService.getStats();
    vscode.commands.executeCommand(
      "setContext",
      "waldoTimer.isRunning",
      stats.isTracking
    );
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (element) {
      return [];
    }

    const stats = TimerService.getStats();
    const items: TreeItem[] = [];

    // Time display
    items.push(
      new TreeItem({
        label: stats.formattedTime,
        contextValue: "time",
        description: "",
        tooltip: "Current session time",
      })
    );

    // Status indicator
    items.push(
      new TreeItem({
        label: stats.isTracking ? "Active" : "Paused",
        contextValue: "status",
        description: stats.isTracking ? "Timer is running" : "Timer is paused",
        tooltip: stats.isTracking
          ? "Timer is currently running"
          : "Timer is currently paused",
      })
    );

    // Break status - only show if on break
    if (BreakService.isOnBreak) {
      items.push(
        new TreeItem({
          label: "On Break",
          contextValue: "break",
          description: "Taking a break",
          tooltip: "You are currently on a break",
        })
      );
    }

    return items;
  }

  private startUpdatingTime() {
    // Clear any existing interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Update the tree view every second
    this.updateInterval = setInterval(() => {
      this.refresh();
    }, 1000);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
    this.updateContext();
  }

  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this._onDidChangeTreeData.dispose();
    if (this.view) {
      this.view.dispose();
    }
  }
}

class TreeItem extends vscode.TreeItem {
  constructor({
    label,
    contextValue,
    description,
    tooltip,
  }: {
    label: string;
    contextValue: string;
    description: string;
    tooltip: string;
  }) {
    super(label, vscode.TreeItemCollapsibleState.None);

    this.description = description;
    this.tooltip = tooltip;
    this.contextValue = contextValue;

    // Set appropriate icons
    switch (contextValue) {
      case "time":
        this.iconPath = new vscode.ThemeIcon("clock");
        break;
      case "status":
        this.iconPath = new vscode.ThemeIcon(
          label === "Active" ? "play" : "debug-pause",
          new vscode.ThemeColor(
            label === "Active" ? "testing.iconPassed" : "testing.iconSkipped"
          )
        );
        break;
      case "break":
        this.iconPath = new vscode.ThemeIcon("coffee");
        break;
    }
  }
}
