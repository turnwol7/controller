export function resetFactory(cancel: () => Promise<void>) {
  return () => () => cancel();
}
