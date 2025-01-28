import assert from "assert";
import * as vscode from "vscode";
import { TimerService } from "../../services/timerService";

suite("TimerService Test Suite", () => {
  let context: vscode.ExtensionContext;
  let globalState: Map<string, any>;
  let statusBarItem: vscode.StatusBarItem;

  setup(() => {
    globalState = new Map();

    context = {
      globalState: {
        get: (key: string, defaultValue?: any) =>
          globalState.get(key) ?? defaultValue,
        update: (key: string, value: any) => {
          globalState.set(key, value);
          return Promise.resolve();
        },
      },
      subscriptions: [],
    } as any;

    statusBarItem = {
      text: "",
      tooltip: "",
      show: () => {},
      hide: () => {},
      dispose: () => {},
    } as any;

    (vscode.window as any).createStatusBarItem = () => statusBarItem;
    (vscode.window as any).showInformationMessage = async () => {};
  });

  test("initialize should set up timer service correctly", async () => {
    TimerService.initialize(context);

    const stats = TimerService.getStats();
    assert.strictEqual(stats.activeTime, 0);
    assert.strictEqual(stats.isTracking, false);
  });

  test("startTimer should start tracking time", async () => {
    TimerService.initialize(context);
    TimerService.startTimer(false);

    const stats = TimerService.getStats();
    assert.strictEqual(stats.isTracking, true);
    assert.strictEqual(globalState.get("waldoIsTracking"), true);
  });

  test("stopTimer should stop tracking time", async () => {
    TimerService.initialize(context);
    TimerService.startTimer(false);
    TimerService.stopTimer();

    const stats = TimerService.getStats();
    assert.strictEqual(stats.isTracking, false);
    assert.strictEqual(globalState.get("waldoIsTracking"), false);
  });

  test("resetTimer should reset all values", async () => {
    TimerService.initialize(context);
    TimerService.startTimer(false);

    // Wait a bit to accumulate some time
    await new Promise((resolve) => setTimeout(resolve, 1100));

    TimerService.resetTimer();

    const stats = TimerService.getStats();
    assert.strictEqual(stats.activeTime, 0);
    assert.strictEqual(stats.isTracking, false);
    assert.strictEqual(globalState.get("waldoActiveTime"), 0);
    assert.strictEqual(globalState.get("waldoIsTracking"), false);
  });

  test("formatTime should format time correctly", async () => {
    TimerService.initialize(context);

    // Set some active time
    (TimerService as any).activeTime = 3661000; // 1h 1m 1s
    const stats = TimerService.getStats();

    assert.strictEqual(stats.formattedTime, "1h 1m 1s");
  });

  test("updateLastActivity should track activity correctly", async () => {
    TimerService.initialize(context);
    const initialIdleTime = TimerService.getIdleTime();

    await new Promise((resolve) => setTimeout(resolve, 100));
    TimerService.updateLastActivity();

    const newIdleTime = TimerService.getIdleTime();
    assert(newIdleTime < initialIdleTime);
  });

  test("idle timeout should pause timer", async function () {
    this.timeout(6000); // Extend timeout for this test

    TimerService.initialize(context);
    TimerService.startTimer(false);

    // Override IDLE_TIMEOUT for testing
    (TimerService as any).IDLE_TIMEOUT = 1000; // 1 second

    if (TimerService["idleCheckInterval"]) {
      clearInterval(TimerService["idleCheckInterval"]);
    }
    TimerService["idleCheckInterval"] = setInterval(() => {
      const timeSinceLastActivity = Date.now() - TimerService["lastActivity"];
      if (timeSinceLastActivity > TimerService["IDLE_TIMEOUT"]) {
        TimerService.pauseTimer(true);
      }
    }, 500);

    // Wait for idle timeout
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const stats = TimerService.getStats();
    assert.strictEqual(stats.isTracking, false);
  });

  test("pauseTimer should pause tracking", async () => {
    TimerService.initialize(context);
    TimerService.startTimer(false);
    TimerService.pauseTimer();

    const stats = TimerService.getStats();
    assert.strictEqual(stats.isTracking, false);
    assert.strictEqual(globalState.get("waldoIsTracking"), false);
  });

  test("getStats should return correct stats object", async () => {
    TimerService.initialize(context);
    const stats = TimerService.getStats();

    assert("activeTime" in stats);
    assert("isTracking" in stats);
    assert("idleTime" in stats);
    assert("formattedTime" in stats);
  });
});
