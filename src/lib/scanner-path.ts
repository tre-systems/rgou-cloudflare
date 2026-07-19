const HIDDEN_OR_SECRET_PATH =
  /(?:^|\/)(?:\.env(?:[./;]|$)|\.git(?:[./;]|$)|\.ssh(?:[./;]|$)|id_(?:rsa|dsa|ed25519)(?:[./;]|$))/i;
const SERVER_SCRIPT_PATH = /\.(?:php\d*|phtml|phar|asp|aspx|cgi)(?:[/.;]|$)/i;
const CMS_PATH = /(?:^|\/)(?:wp-admin|wp-content|wp-includes|phpmyadmin)(?:[/.;]|$)/i;
const SECRET_FILE =
  /(?:^|\/)(?:credentials|secrets?|serviceaccountkey|firebase-adminsdk|terraform\.tfvars)(?:\.[^/;]+)?(?:[/.;]|$)/i;

function decodePath(pathname: string): string {
  let decoded = pathname;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded.replaceAll('\\', '/');
}

export function isScannerPath(pathname: string): boolean {
  const decoded = decodePath(pathname);
  return (
    HIDDEN_OR_SECRET_PATH.test(decoded) ||
    SERVER_SCRIPT_PATH.test(decoded) ||
    CMS_PATH.test(decoded) ||
    SECRET_FILE.test(decoded)
  );
}
