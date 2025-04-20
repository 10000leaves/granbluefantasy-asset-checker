/**
 * ユーザー入力のバリデーションユーティリティ
 * SQLインジェクションやXSS攻撃などのセキュリティリスクを軽減するための関数を提供
 */

// SQLインジェクションの可能性がある危険なパターン
const SQL_INJECTION_PATTERNS = [
  /;\s*DROP\s+/i,
  /;\s*DELETE\s+/i,
  /;\s*UPDATE\s+/i,
  /;\s*INSERT\s+/i,
  /;\s*ALTER\s+/i,
  /;\s*CREATE\s+/i,
  /UNION\s+SELECT/i,
  /OR\s+1\s*=\s*1/i,
  /OR\s+'[^']*'\s*=\s*'[^']*'/i,
  /--/,
  /\/\*/,
  /\*\//
];

// XSS攻撃の可能性がある危険なパターン
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
  /javascript:/i,
  /on\w+=/i,
  /<iframe/i,
  /<embed/i,
  /<object/i
];

/**
 * 文字列がSQLインジェクションの可能性がある危険なパターンを含んでいるかチェック
 * @param input チェックする文字列
 * @returns 危険なパターンを含む場合はtrue、そうでない場合はfalse
 */
export const hasSqlInjectionRisk = (input: string): boolean => {
  if (typeof input !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * 文字列がXSS攻撃の可能性がある危険なパターンを含んでいるかチェック
 * @param input チェックする文字列
 * @returns 危険なパターンを含む場合はtrue、そうでない場合はfalse
 */
export const hasXssRisk = (input: string): boolean => {
  if (typeof input !== 'string') return false;
  return XSS_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * 文字列をサニタイズ（特殊文字をエスケープ）
 * @param input サニタイズする文字列
 * @returns サニタイズされた文字列
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * オブジェクトのすべての文字列プロパティをサニタイズ
 * @param obj サニタイズするオブジェクト
 * @returns サニタイズされたオブジェクト
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  const result: Record<string, any> = { ...obj };
  
  for (const key in result) {
    if (typeof result[key] === 'string') {
      result[key] = sanitizeString(result[key]);
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = sanitizeObject(result[key]);
    }
  }
  
  return result as T;
};

/**
 * ユーザー入力が安全かどうかをチェック
 * SQLインジェクションとXSS攻撃の両方のリスクをチェック
 * @param input チェックする文字列
 * @returns 安全な場合はtrue、危険な場合はfalse
 */
export const isInputSafe = (input: string): boolean => {
  if (typeof input !== 'string') return true;
  return !hasSqlInjectionRisk(input) && !hasXssRisk(input);
};

/**
 * リクエストボディのバリデーション
 * @param body バリデーションするリクエストボディ
 * @param requiredFields 必須フィールドの配列
 * @returns バリデーション結果（成功した場合は{valid: true}、失敗した場合は{valid: false, error: エラーメッセージ}）
 */
export const validateRequestBody = (
  body: Record<string, any>,
  requiredFields: string[] = []
): { valid: boolean; error?: string } => {
  // 必須フィールドのチェック
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return { valid: false, error: `${field} is required` };
    }
  }
  
  // 各フィールドの安全性チェック
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string' && !isInputSafe(value)) {
      return { valid: false, error: `Invalid input in ${key}` };
    }
  }
  
  return { valid: true };
};

/**
 * クエリパラメータのバリデーション
 * @param params バリデーションするクエリパラメータ
 * @param allowedParams 許可されたパラメータの配列
 * @returns バリデーション結果（成功した場合は{valid: true}、失敗した場合は{valid: false, error: エラーメッセージ}）
 */
export const validateQueryParams = (
  params: URLSearchParams,
  allowedParams: string[] = []
): { valid: boolean; error?: string } => {
  // 許可されたパラメータのみを受け入れる
  for (const [key, value] of params.entries()) {
    if (!allowedParams.includes(key)) {
      return { valid: false, error: `Invalid parameter: ${key}` };
    }
    
    if (!isInputSafe(value)) {
      return { valid: false, error: `Invalid value for parameter: ${key}` };
    }
  }
  
  return { valid: true };
};
