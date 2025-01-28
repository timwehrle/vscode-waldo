import * as vscode from "vscode";
import { TimerService } from "../services/timerService";

export class SidebarProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    TreeItem | undefined | null | void
  > = new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;
  private updateInterval: NodeJS.Timeout | undefined;
  private view: vscode.TreeView<TreeItem> | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {
    // First register as tree data provider
    vscode.window.registerTreeDataProvider("waldoTimerSidebar", this);

    // Then create the TreeView
    this.view = vscode.window.createTreeView("waldoTimerSidebar", {
      treeDataProvider: this,
      showCollapseAll: false,
    });

    // Set initial context
    this.updateContext();

    // Start the update interval
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

  async getChildren(): Promise<TreeItem[]> {
    const stats = TimerService.getStats();
    const items: TreeItem[] = [];

    // Time display with larger text and better formatting
    items.push(
      new TreeItem({
        label: stats.formattedTime,
        contextValue: "time",
        description: "", // Clear description
        tooltip: "Current session time",
      })
    );

    // Status with descriptive text
    items.push(
      new TreeItem({
        label: stats.isTracking ? "Active" : "Paused",
        contextValue: "status",
        description: stats.isTracking ? "Timer is running" : "Timer is stopped",
        tooltip: stats.isTracking
          ? "Timer is currently running"
          : "Timer is currently paused",
      })
    );

    return items;
  }

  private startUpdatingTime() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this._onDidChangeTreeData.fire();
      this.updateContext();
    }, 1000);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
    this.updateContext();
  }

  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
    this._onDidChangeTreeData.dispose();
    this.view?.dispose();
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

    // Add icons based on context
    switch (contextValue) {
      case "time":
        this.iconPath = new vscode.ThemeIcon("clock");
        break;
      case "status":
        this.iconPath = new vscode.ThemeIcon(
          label === "Active" ? "play-circle" : "debug-pause",
          new vscode.ThemeColor(
            label === "Active" ? "testing.iconPassed" : "testing.iconSkipped"
          )
        );
        break;
    }
  }
}
