import * as vscode from "vscode";
import { TimerService } from "../services/timerService";
import { join } from "path";
import { readFileSync } from "fs";

export class SidebarProvider implements vscode.WebviewViewProvider {
  private _view: vscode.WebviewView | undefined;
  private updateInterval: NodeJS.Timeout | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Resolves the webview view and sets up the event listeners
   */
  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;

    // Configure webview options
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "src",
          "views",
          "sidebar"
        ),
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "node_modules",
          "@vscode",
          "codicons",
          "dist"
        ),
      ],
    };

    // Handle messages from the webview
    this.setupMessageHandlers(webviewView.webview);

    // Set initial HTML content
    webviewView.webview.html = this.getHtmlContent();

    // Start updating time when the view becomes visible
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.startUpdatingTime();
      } else {
        this.stopUpdatingTime();
      }
    });

    // Start updating time immediately if the view is already visible
    if (webviewView.visible) {
      this.startUpdatingTime();
    }
  }

  /**
   * Sets up message handlers for communication between the webview and extension.
   */
  private setupMessageHandlers(webview: vscode.Webview): void {
    webview.onDidReceiveMessage((message) => {
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
        default:
          console.warn(`Unknown command: ${message.command}`);
      }
    });
  }

  /**
   * Generates the HTML content for the webview.
   */
  private getHtmlContent(): string {
    const htmlPath = join(
      this.context.extensionPath,
      "src",
      "views",
      "sidebar",
      "sidebar.html"
    );

    try {
      let html = readFileSync(htmlPath, "utf-8");

      // Inject Codicons CSS
      const codiconsUri = this._view!.webview.asWebviewUri(
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "node_modules",
          "@vscode/codicons",
          "dist",
          "codicon.css"
        )
      );

      // Inject custom CSS
      const stylesUri = this._view!.webview.asWebviewUri(
        vscode.Uri.joinPath(
          this.context.extensionUri,
          "src",
          "views",
          "sidebar",
          "sidebar.css"
        )
      );

      // Replace placeholders in the HTML with actual URIs
      html = html.replace(
        "</head>",
        `<link href="${codiconsUri}" rel="stylesheet" type="text/css">
         <link href="${stylesUri}" rel="stylesheet" type="text/css">
         </head>`
      );

      return html;
    } catch (error) {
      console.error(`Failed to load HTML content: ${error}`);
      return `<html><body><h1>Failed to load HTML content</h1></body></html>`;
    }
  }

  /**
   * Starts the interval to update the time in the webview.
   */
  private startUpdatingTime() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      if (this._view) {
        const time = TimerService.getStats().formattedTime;
        const isTracking = TimerService.getStats().isTracking;
        const idleTime = Math.floor(TimerService.getIdleTime() / 1000);

        this._view.webview.postMessage({
          type: "update-time",
          time: time,
          isTracking,
          idleTime,
        });
      }
    }, 1000);
  }

  /**
   * Stops the interval for updating the time.
   */
  private stopUpdatingTime(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  /**
   * Cleans up resources when the provider is disposed.
   */
  dispose(): void {
    this.stopUpdatingTime();
  }
}
