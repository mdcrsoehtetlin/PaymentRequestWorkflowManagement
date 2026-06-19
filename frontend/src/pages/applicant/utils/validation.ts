import { type PaymentRequestFormValues, BANK_INFO_REQUIRED_METHODS } from '../../../types';

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export function validateDraft(
  values: PaymentRequestFormValues,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Only validate fields that have values
  if (values.applicationDate) {
    const date = new Date(values.applicationDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) {
      errors.push({
        field: 'applicationDate',
        code: 'VAL-APP-001',
        message: '申請日は本日以前の日付を入力してください',
      });
    }
  }

  if (values.purpose && values.purpose.length > 500) {
    errors.push({
      field: 'purpose',
      code: 'VAL-APP-003',
      message: '目的を入力してください（最大500文字）',
    });
  }

  return errors;
}

export function validateSubmit(
  values: PaymentRequestFormValues,
): ValidationError[] {
  const errors: ValidationError[] = [];

  // All mandatory fields required
  if (!values.applicationDate) {
    errors.push({ field: 'applicationDate', code: 'VAL-APP-001', message: '申請日を入力してください' });
  }
  if (!values.desiredPaymentDate) {
    errors.push({ field: 'desiredPaymentDate', code: 'VAL-APP-002', message: '支払希望日を入力してください' });
  }
  if (!values.purpose?.trim()) {
    errors.push({ field: 'purpose', code: 'VAL-APP-003', message: '目的を入力してください（最大500文字）' });
  }
  if (!values.requestContent?.trim()) {
    errors.push({ field: 'requestContent', code: 'VAL-APP-004', message: '申請内容を入力してください（最大1000文字）' });
  }
  if (!values.currencyId) {
    errors.push({ field: 'currencyId', code: 'VAL-APP-003', message: '通貨を選択してください' });
  }
  if (!values.paymentTypeId) {
    errors.push({ field: 'paymentTypeId', code: 'VAL-APP-003', message: '支払種別を選択してください' });
  }
  if (!values.paymentMethodId) {
    errors.push({ field: 'paymentMethodId', code: 'VAL-APP-003', message: '支払方法を選択してください' });
  }
  if (!values.managerUserId) {
    errors.push({ field: 'managerUserId', code: 'VAL-APP-003', message: '担当マネージャーを選択してください' });
  }

  // Conditional: bank account info
  if (
    values.paymentMethodId &&
    BANK_INFO_REQUIRED_METHODS.includes(values.paymentMethodId) &&
    !values.bankAccountInfo?.trim()
  ) {
    errors.push({ field: 'bankAccountInfo', code: 'VAL-APP-005', message: '銀行口座情報を入力してください' });
  }

  // Breakdown items
  if (!values.breakdownItems || values.breakdownItems.length === 0) {
    errors.push({ field: 'breakdownItems', code: 'VAL-APP-006', message: '明細は1件以上15件以内で入力してください' });
  }

  // Draft-mode validations also apply
  errors.push(...validateDraft(values));

  return errors;
}
