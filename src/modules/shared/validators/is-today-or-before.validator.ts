import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isTodayOrBefore', async: false })
export class IsTodayOrBeforeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (!value) return false;
    // Input might be a Date object or an ISO string. Convert to Date.
    const dateValue = new Date(value as string | number | Date);
    if (isNaN(dateValue.getTime())) return false;

    const today = new Date();
    // Compare dates ignoring time
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateValue);
    targetDate.setHours(0, 0, 0, 0);

    return targetDate.getTime() <= today.getTime();
  }

  defaultMessage() {
    return 'VAL-APP-001: 申請日は本日以前の日付を入力してください';
  }
}

export function IsTodayOrBefore(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsTodayOrBeforeConstraint,
    });
  };
}
