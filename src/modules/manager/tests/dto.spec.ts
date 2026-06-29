import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { QueryRequestsDto } from '../dto/query-requests.dto';
import { ApproveRequestDto } from '../dto/approve-request.dto';
import { RejectRequestDto } from '../dto/reject-request.dto';
import { StartReviewDto } from '../dto/start-review.dto';

describe('QueryRequestsDto validation', () => {
  it('should pass validation with valid statusId', async () => {
    const dto = plainToInstance(QueryRequestsDto, {
      statusId: '1',
      dateFrom: '2026-06-01',
      dateTo: '2026-06-30',
      applicant: 'John Doe',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.statusId).toBe(1);
  });

  it('should fail validation with invalid statusId', async () => {
    const dto = plainToInstance(QueryRequestsDto, {
      statusId: 'not-a-number',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('ApproveRequestDto validation', () => {
  it('should pass validation with valid fields', async () => {
    const dto = plainToInstance(ApproveRequestDto, {
      modifiedDate: new Date().toISOString(),
      comment: 'Valid comment',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass validation without comment', async () => {
    const dto = plainToInstance(ApproveRequestDto, {
      modifiedDate: new Date().toISOString(),
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid modifiedDate', async () => {
    const dto = plainToInstance(ApproveRequestDto, {
      modifiedDate: 'not-a-date',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with too long comment', async () => {
    const dto = plainToInstance(ApproveRequestDto, {
      modifiedDate: new Date().toISOString(),
      comment: 'a'.repeat(501),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('RejectRequestDto validation', () => {
  it('should pass validation with valid comment (>= 10 characters)', async () => {
    const dto = plainToInstance(RejectRequestDto, {
      modifiedDate: new Date().toISOString(),
      comment: 'This comment is long enough.',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with too short comment (< 10 characters)', async () => {
    const dto = plainToInstance(RejectRequestDto, {
      modifiedDate: new Date().toISOString(),
      comment: 'Too short',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with too long comment (> 500 characters)', async () => {
    const dto = plainToInstance(RejectRequestDto, {
      modifiedDate: new Date().toISOString(),
      comment: 'a'.repeat(501),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with invalid modifiedDate', async () => {
    const dto = plainToInstance(RejectRequestDto, {
      modifiedDate: 'not-a-date',
      comment: 'This comment is long enough.',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('StartReviewDto validation', () => {
  it('should pass validation with valid modifiedDate', async () => {
    const dto = plainToInstance(StartReviewDto, {
      modifiedDate: new Date().toISOString(),
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid modifiedDate', async () => {
    const dto = plainToInstance(StartReviewDto, {
      modifiedDate: 'not-a-date',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
