// Shared input rules used by forms (browser) and server functions.
export const PASSWORD_MIN = 10;
export const PASSCODE_MIN = 6;
export const PASSCODE_MAX = 32;

export function passwordProblems(password: string): string[] {
  const problems: string[] = [];
  if (password.length < PASSWORD_MIN) problems.push(`At least ${PASSWORD_MIN} characters`);
  if (password.length > 72) problems.push("At most 72 characters");
  if (!/[a-z]/.test(password)) problems.push("A lowercase letter");
  if (!/[A-Z]/.test(password)) problems.push("An uppercase letter");
  if (!/[0-9]/.test(password)) problems.push("A number");
  if (!/[^A-Za-z0-9]/.test(password)) problems.push("A symbol");
  return problems;
}

export function isStrongPassword(password: string) {
  return passwordProblems(password).length === 0;
}

export function passcodeProblem(passcode: string): string | null {
  if (passcode.length < PASSCODE_MIN) return `Passcode must be at least ${PASSCODE_MIN} characters`;
  if (passcode.length > PASSCODE_MAX) return `Passcode must be at most ${PASSCODE_MAX} characters`;
  if (/^(.)\1+$/.test(passcode)) return "Passcode cannot be one repeated character";
  if ("0123456789".includes(passcode) || "9876543210".includes(passcode)) return "Passcode cannot be a simple sequence";
  return null;
}

export function normaliseFamilyCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isFamilyCode(code: string) {
  return /^CC[A-Z0-9]{6}$/.test(code);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RE = /^\+?[0-9 ()-]{6,20}$/;
export const TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function uploadProblem(file: { type: string; size: number }): string | null {
  if (!ALLOWED_UPLOAD_TYPES[file.type]) return "Only PDF, JPG or PNG files are allowed";
  if (file.size > MAX_UPLOAD_BYTES) return "File must be 10 MB or smaller";
  if (file.size === 0) return "File is empty";
  return null;
}

export const MAX_CARETAKERS = 3;
export const MAX_ELDERS = 2;

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const DISCLAIMER = "This app supports care but is not a substitute for medical advice.";
