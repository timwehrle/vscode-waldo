import { TimerService } from "../services/timerService";

export function stopTimerCommand() {
  TimerService.stopTimer();
}
