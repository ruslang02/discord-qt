export class CancelToken {
  cancelled = false;

  cancel() { this.cancelled = true; }
}
