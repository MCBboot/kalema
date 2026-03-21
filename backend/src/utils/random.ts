export function pickRandom<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error("Cannot pick from an empty array");
  }
  return arr[Math.floor(Math.random() * arr.length)];
}
