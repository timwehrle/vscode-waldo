import { TimerService } from "../services/timerService";

export function startTimerCommand() {
  TimerService.startTimer();
}
