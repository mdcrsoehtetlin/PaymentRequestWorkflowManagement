import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isTodayOrAfter', async: false })
export class IsTodayOrAfterConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (!value) return false;
    const dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateValue);
    targetDate.setHours(0, 0, 0, 0);
    
    return targetDate.getTime() >= today.getTime();
  }

  defaultMessage() {
    return 'VAL-APP-002: 支払希望日は本日以降の日付を入力してください';
  }
}

export function IsTodayOrAfter(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsTodayOrAfterConstraint,
    });
  };
}
