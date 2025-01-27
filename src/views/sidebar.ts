import * as vscode from "vscode";
import { TimerService } from "../services/timerService";
import { join } from "path";
import { readFileSync } from "fs";

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private updateInterval: NodeJS.Timeout | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "startTimer":
          vscode.commands.executeCommand("waldo.startTimer");
          break;
        case "stopTimer":
          vscode.commands.executeCommand("waldo.stopTimer");
          break;
        case "resetTimer":
          vscode.commands.executeCommand("waldo.resetTimer");
          break;
        case "showStats":
          vscode.commands.executeCommand("waldo.showStats");
          break;
      }
    });

    this._view.webview.html = this.getHtmlContent();
    this.startUpdatingTime();

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this._view!.webview.html = this.getHtmlContent();
        this.startUpdatingTime();
      } else {
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
          this.updateInterval = undefined;
        }
      }
    });
  }

  private getHtmlContent(): string {
    const htmlPath = join(
      this.context.extensionPath,
      "src",
      "views",
      "sidebar.html"
    );
    let html = readFileSync(htmlPath, "utf-8");

    const codiconsUri = this._view!.webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "@vscode/codicons",
        "dist",
        "codicon.css"
      )
    );

    html = html.replace(
      "</head>",
      `<link href="${codiconsUri}" rel="stylesheet" type="text/css"></head>`
    );

    return html;
  }

  private startUpdatingTime() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      if (this._view) {
        const time = TimerService.getActiveTime();
        const isTracking = TimerService.isTimerRunning();
        const idleTime = Math.floor(TimerService.getIdleTime() / 1000);

        this._view.webview.postMessage({
          type: "update-time",
          time: TimerService.formatTime(time),
          isTracking,
          idleTime,
        });
      }
    }, 1000);
  }

  dispose() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }
}
