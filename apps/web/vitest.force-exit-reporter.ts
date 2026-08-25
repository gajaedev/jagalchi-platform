import type { Reporter } from 'vitest/reporters';

export default class ForceExitReporter implements Reporter {
  private expectedModules = 0;
  private finishedModules = new Set<object>();
  private hasFailure = false;
  private exitTimer: ReturnType<typeof setTimeout> | undefined;

  onTestRunStart(specifications: ReadonlyArray<unknown>) {
    this.expectedModules = specifications.length;
    this.finishedModules.clear();
    this.hasFailure = false;
    this.exitTimer = undefined;
  }

  onTestCaseResult(testCase: { result: () => { state: string } }) {
    if (testCase.result().state === 'failed') {
      this.hasFailure = true;
    }
  }

  onTestModuleStart() {
    this.clearExitTimer();
  }

  onTestModuleEnd(testModule: object) {
    this.finishedModules.add(testModule);

    if (this.expectedModules > 0 && this.finishedModules.size >= this.expectedModules) {
      this.scheduleExit(1500);
      return;
    }

    this.scheduleExit(15000);
  }

  onTestRunEnd(_modules: unknown, _errors: ReadonlyArray<unknown>, reason: string) {
    if (_errors.length > 0 || reason === 'failed') {
      this.hasFailure = true;
    }

    this.scheduleExit(1500);
  }

  private scheduleExit(delayMs: number) {
    this.clearExitTimer();

    this.exitTimer = setTimeout(() => {
      process.exit(this.hasFailure ? 1 : 0);
    }, delayMs);
  }

  private clearExitTimer() {
    if (this.exitTimer) {
      clearTimeout(this.exitTimer);
      this.exitTimer = undefined;
    }
  }
}
