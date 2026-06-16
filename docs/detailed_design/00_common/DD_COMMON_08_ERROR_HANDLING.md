# DD_COMMON_08 — Error Handling

> **Doc ID:** PRWM-DD-COM-008 | **Version:** 1.0 | **Status:** Released  
> **Last Updated:** 2026-06-16

---

## 1. Error Type Taxonomy

| HTTP Status | Error Name | Description | When Used |
|:-----------:|-----------|-------------|-----------|
| 400 | Bad Request | Input validation failure | Missing/invalid fields in DTO |
| 401 | Unauthorized | Missing or expired JWT | No token, expired token, invalid token |
| 403 | Forbidden | Insufficient permissions | Wrong role, not owner of resource |
| 404 | Not Found | Resource doesn't exist | Invalid ID, soft-deleted record |
| 409 | Conflict | Concurrent modification | Optimistic lock failure (modifiedDate mismatch) |
| 413 | Payload Too Large | File exceeds size limit | File > 10MB, total > 50MB |
| 415 | Unsupported Media Type | Invalid file type | Non-PDF/PNG/JPEG upload |
| 422 | Unprocessable Entity | Business rule violation | Invalid status transition, non-draft delete |
| 429 | Too Many Requests | Rate limit exceeded | > 100 requests/minute |
| 500 | Internal Server Error | Unexpected server error | Unhandled exceptions, DB errors |

---

## 2. Standardized Error Response Format

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "この操作は現在のステータスでは実行できません",
  "details": [
    {
      "field": "statusId",
      "code": "ERR-APP-422-01",
      "message": "この操作は現在のステータスでは実行できません"
    }
  ],
  "timestamp": "2026-06-16T06:00:00.000Z",
  "path": "/api/v1/applicant/payment-requests/42/submit-manager"
}
```

---

## 3. Backend Error Handling

### 3.1 Custom Exception Classes

```typescript
// src/modules/shared/exceptions/business-rule.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessRuleException extends HttpException {
  constructor(message: string, details?: { field: string; code: string; message: string }[]) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'Unprocessable Entity',
        message,
        details: details || [],
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

// src/modules/shared/exceptions/ownership.exception.ts
import { ForbiddenException } from '@nestjs/common';

export class OwnershipException extends ForbiddenException {
  constructor() {
    super('この操作を実行する権限がありません');
  }
}
```

### 3.2 Global Exception Filter

```typescript
// src/modules/shared/filters/http-exception.filter.ts
import {
  ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'システムエラーが発生しました。管理者に連絡してください';
    let details: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'object' && exResponse !== null) {
        message = (exResponse as any).message || message;
        details = (exResponse as any).details || [];
      } else {
        message = exResponse as string;
      }
    }

    // Log detailed error server-side (English)
    this.logger.error(
      `[${status}] ${request.method} ${request.url} - ${
        exception instanceof Error ? exception.message : 'Unknown error'
      }`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status] || 'Error',
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### 3.3 Service-Level Error Handling Pattern

Every service method follows this pattern:

```typescript
async someOperation(id: number, userId: number): Promise<PaymentRequest> {
  // 1. Fetch record
  const request = await this.repo.findOne({
    where: { paymentRequestId: id, isDeleted: false },
  });
  if (!request) {
    throw new NotFoundException('指定された申請が見つかりません');
  }

  // 2. Check ownership
  if (request.applicantUserId !== userId) {
    throw new ForbiddenException('この操作を実行する権限がありません');
  }

  // 3. Check business rules
  if (!EDITABLE_STATUSES.includes(request.statusId)) {
    throw new BusinessRuleException('この操作は現在のステータスでは実行できません', [
      { field: 'statusId', code: 'ERR-APP-422-01', message: 'この操作は現在のステータスでは実行できません' },
    ]);
  }

  // 4. Execute operation in try-catch
  try {
    // ... business logic
    return updatedRequest;
  } catch (error) {
    this.logger.error(`Operation failed: ${error.message}`, error.stack);
    throw new InternalServerErrorException('システムエラーが発生しました');
  }
}
```

---

## 4. Frontend Error Handling

### 4.1 Axios Error Interceptor

```typescript
// In api-client.ts response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    switch (status) {
      case 401:
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        break;
      case 403:
        showToast('error', data?.message || 'この操作を実行する権限がありません');
        break;
      case 409:
        showToast('warning', 'この申請は他のユーザーによって更新されました');
        // Auto-refresh the page data
        break;
      case 422:
        // Business rule error — display to user
        showToast('error', data?.message || 'ビジネスルールエラーが発生しました');
        break;
      case 500:
        showToast('error', 'システムエラーが発生しました。管理者に連絡してください');
        break;
      default:
        showToast('error', data?.message || 'エラーが発生しました');
    }

    return Promise.reject(error);
  },
);
```

### 4.2 Form Validation Error Display

| Display Method | When Used | Visual |
|---------------|-----------|--------|
| **Inline field error** | Field-level validation | Red border on input + red text below |
| **Form error banner** | Multiple validation errors on submit | Red banner at top of form with error list |
| **Toast notification** | Server-side errors (403, 422, 500) | Top-right toast with auto-dismiss |

**Inline field error pattern:**
```tsx
<div>
  <input
    className={`border rounded-lg px-3 py-2 ${errors.purpose ? 'border-red-500' : 'border-slate-300'}`}
    {...register('purpose')}
  />
  {errors.purpose && (
    <p className="text-sm text-red-600 mt-1">{errors.purpose.message}</p>
  )}
</div>
```

### 4.3 Error Boundary Component

```typescript
// frontend/src/components/shared/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-red-600">エラーが発生しました</h1>
          <p className="text-slate-500 mt-2">ページを再読み込みしてください</p>
          <button onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-lg">
            再読み込み
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 5. Complete Error Message Catalog

| Code | Japanese Message | HTTP | Category |
|------|-----------------|:----:|----------|
| VAL-APP-001 | 申請日は本日以前の日付を入力してください | 400 | Validation |
| VAL-APP-002 | 支払希望日は本日以降の日付を入力してください | 400 | Validation |
| VAL-APP-003 | 目的を入力してください（最大500文字） | 400 | Validation |
| VAL-APP-004 | 申請内容を入力してください（最大1000文字） | 400 | Validation |
| VAL-APP-005 | 銀行口座情報を入力してください | 400 | Validation |
| VAL-APP-006 | 明細は1件以上15件以内で入力してください | 400 | Validation |
| VAL-APP-007 | 金額は0より大きい値を入力してください | 400 | Validation |
| VAL-APP-008 | 許可されていないファイル形式です | 415 | File |
| VAL-APP-009 | ファイルサイズが上限（10MB）を超えています | 413 | File |
| VAL-APP-010 | 領収書ファイルを添付してください | 422 | Business |
| ERR-APP-401 | 認証が必要です。再度ログインしてください | 401 | Auth |
| ERR-APP-403 | この操作を実行する権限がありません | 403 | Auth |
| ERR-APP-404 | 指定された申請が見つかりません | 404 | Not Found |
| ERR-APP-409 | この申請は他のユーザーによって更新されました | 409 | Concurrency |
| ERR-APP-422-01 | この操作は現在のステータスでは実行できません | 422 | Business |
| ERR-APP-422-02 | 下書き以外のステータスの申請は削除できません | 422 | Business |
| ERR-APP-422-03 | 合計金額が明細金額の合計と一致しません | 422 | Business |
| ERR-APP-500 | システムエラーが発生しました。管理者に連絡してください | 500 | Server |

---

## 6. Cross-References

| Related Document | Purpose |
|-----------------|---------|
| [DD_COMMON_04](./DD_COMMON_04_SHARED_VALIDATION.md) | Validation rules that produce these errors |
| [DD_COMMON_07](./DD_COMMON_07_AUTH_AND_MIDDLEWARE.md) | Auth errors (401, 403) |
| [DD_APPLICANT_05](../01_applicant/DD_APPLICANT_05_API_ENDPOINTS.md) | Endpoint-specific error cases |
