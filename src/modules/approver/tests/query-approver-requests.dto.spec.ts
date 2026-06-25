import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  QueryApproverRequestsDto,
  ApproverRequestSortFields,
} from '../dto/query-approver-requests.dto';

describe('ApproverRequestSortFields', () => {
  it('should have all sort field values', () => {
    expect(ApproverRequestSortFields.CREATED_DATE).toBe('createdDate');
    expect(ApproverRequestSortFields.APPLICATION_DATE).toBe('applicationDate');
    expect(ApproverRequestSortFields.DESIRED_PAYMENT_DATE).toBe(
      'desiredPaymentDate',
    );
    expect(ApproverRequestSortFields.TOTAL_AMOUNT).toBe('totalAmount');
    expect(ApproverRequestSortFields.STATUS).toBe('statusId');
    expect(ApproverRequestSortFields.MANAGER_VERIFIED_DATE).toBe(
      'managerVerificationDate',
    );
  });
});

describe('QueryApproverRequestsDto', () => {
  it('should transform statusId from string to number', () => {
    const dto = plainToInstance(QueryApproverRequestsDto, {
      page: '1',
      pageSize: '10',
      statusId: '6',
    });
    expect(dto.statusId).toBe(6);
  });

  it('should transform showAll from string to boolean', () => {
    const dto = plainToInstance(QueryApproverRequestsDto, {
      page: '1',
      pageSize: '10',
      showAll: 'true',
    });
    expect(dto.showAll).toBe(true);
  });

  it('should transform desiredDateAlert from string to boolean', () => {
    const dto = plainToInstance(QueryApproverRequestsDto, {
      page: '1',
      pageSize: '10',
      desiredDateAlert: 'true',
    });
    expect(dto.desiredDateAlert).toBe(true);
  });

  it('should default page and pageSize', () => {
    const dto = plainToInstance(QueryApproverRequestsDto, {});
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(10);
  });
});
