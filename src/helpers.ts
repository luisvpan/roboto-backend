// Helpers
export function isValidJson(data: string): boolean {
  try {
    JSON.parse(data);
    return true;
  } catch (e) {
    return false;
  }
}
