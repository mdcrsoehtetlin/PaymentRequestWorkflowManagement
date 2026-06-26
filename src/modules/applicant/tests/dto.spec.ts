import 'reflect-metadata';
import { BreakdownItemDto } from '../dto/breakdown-item.dto';
import { CreatePaymentRequestDraftDto } from '../dto/create-payment-request.dto';
import { PaymentRequestResponseDto } from '../dto/payment-request-response.dto';
import { SubmitManagerDto } from '../dto/submit-manager.dto';
import { UpdatePaymentRequestDto } from '../dto/update-payment-request.dto';
import { UploadReceiptDto } from '../dto/upload-receipt.dto';

describe('Applicant DTOs', () => {
  it('should create instances of DTOs', () => {
    expect(new BreakdownItemDto()).toBeDefined();
    expect(new CreatePaymentRequestDraftDto()).toBeDefined();
    expect(new PaymentRequestResponseDto()).toBeDefined();
    expect(new SubmitManagerDto()).toBeDefined();
    expect(new UpdatePaymentRequestDto()).toBeDefined();
    expect(new UploadReceiptDto()).toBeDefined();
  });
});
