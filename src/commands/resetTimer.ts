import { TimerService } from "../services/timerService";

export function resetTimerCommand() {
  TimerService.resetTimer();
}
