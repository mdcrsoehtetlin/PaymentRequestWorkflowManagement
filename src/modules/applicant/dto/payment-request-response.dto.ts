export class PaymentRequestResponseDto {
  id!: number;
  request_number!: string;
  status_id!: number;
  total_amount!: string;
  currency_id!: number;
  application_date!: string;
  desired_payment_date!: string;
  payment_method_id!: number;
  has_receipt!: boolean;
  created_at!: Date;
  updated_at!: Date;
}

export class PaginatedPaymentRequestResponseDto {
  items!: PaymentRequestResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}

export class DashboardKpiDto {
  total_requests!: number;
  pending_review!: number;
  approved!: number;
  rejected!: number;
}

export class DashboardResponseDto {
  kpis!: DashboardKpiDto;
  requests!: PaginatedPaymentRequestResponseDto;
}
