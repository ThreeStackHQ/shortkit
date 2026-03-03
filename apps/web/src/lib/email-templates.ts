import { escapeHtml } from '@/lib/escape';

export function welcomeEmail(name: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <h1>Welcome to ShortKit, ${escapeHtml(name)}!</h1>
  <p>Your account is ready. Start creating short links today.</p>
</body>
</html>`;
}

export function linkCreatedEmail(name: string, slug: string, destination: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <h1>Link Created</h1>
  <p>Hi ${escapeHtml(name)}, your new short link is ready:</p>
  <p><strong>Slug:</strong> ${escapeHtml(slug)}</p>
  <p><strong>Destination:</strong> ${escapeHtml(destination)}</p>
</body>
</html>`;
}

export function passwordResetEmail(name: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <h1>Password Reset</h1>
  <p>Hi ${escapeHtml(name)},</p>
  <p>Click the link below to reset your password:</p>
  <a href="${escapeHtml(resetUrl)}">Reset Password</a>
</body>
</html>`;
}
