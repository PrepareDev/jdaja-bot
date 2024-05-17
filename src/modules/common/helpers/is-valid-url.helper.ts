// Hack to check is string is valid url using std URL constructor
export default function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    // URL constructor throws error only if URL is invalid
    return false;
  }
}
