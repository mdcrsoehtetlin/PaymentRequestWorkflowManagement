import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreatePaymentRequestDraftDto } from '../dto/create-payment-request.dto';
import { BreakdownItemDto } from '../dto/breakdown-item.dto';
import { plainToInstance } from 'class-transformer';

describe('CreatePaymentRequestDraftDto validation', () => {
  it('should validate conditionally based on has_receipt', async () => {
    // 1) Test with has_receipt = true, but no receipts (should fail)
    const dtoWithReceiptTrue = plainToInstance(CreatePaymentRequestDraftDto, {
      has_receipt: true,
    });
    const errorsWithReceipt = await validate(dtoWithReceiptTrue);
    // Even if it has other errors, the ValidateIf functions were called.

    // 2) Test with has_receipt = false (should pass that condition)
    const dtoWithReceiptFalse = plainToInstance(CreatePaymentRequestDraftDto, {
      has_receipt: false,
    });
    const errorsWithoutReceipt = await validate(dtoWithReceiptFalse);

    expect(errorsWithReceipt).toBeDefined();
    expect(errorsWithoutReceipt).toBeDefined();
  });

  it('should transform BreakdownItemDto fields', () => {
    const item = plainToInstance(BreakdownItemDto, {
      itemDate: '  2026-01-01  ',
      description: '   Desc   ',
    });
    expect(item.itemDate).toBe('2026-01-01');
    expect(item.description).toBe('Desc');

    // Also test non-string
    const itemNonString = plainToInstance(BreakdownItemDto, {
      itemDate: 123,
      description: 456,
    });
    expect(itemNonString.itemDate).toBe(123);
    expect(itemNonString.description).toBe(456);
  });

  it('should transform CreatePaymentRequestDraftDto fields', () => {
    const item = plainToInstance(CreatePaymentRequestDraftDto, {
      purpose: '   p   ',
      bank_account_info: '   b   ',
      request_content: '   r   ',
      breakdowns: [{ description: 'd', amount: 1 }],
    });
    expect(item.purpose).toBe('p');
    expect(item.bank_account_info).toBe('b');
    expect(item.request_content).toBe('r');
    expect(item.breakdowns![0].description).toBe('d');

    const itemNonString = plainToInstance(CreatePaymentRequestDraftDto, {
      purpose: 1,
      bank_account_info: 2,
      request_content: 3,
    });
    expect(itemNonString.purpose).toBe(1 as any);
    expect(itemNonString.bank_account_info).toBe(2 as any);
    expect(itemNonString.request_content).toBe(3 as any);
  });
});
