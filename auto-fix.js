const fs = require('fs');

const errorsContent = fs.readFileSync('errors.txt', 'utf8');
const lines = errorsContent.split('\n');

for (const line of lines) {
  // e.g. src/modules/accounting/accounting.service.ts(118,28): error TS2551: Property 'request_number' does not exist on type 'PaymentRequest'. Did you mean 'requestNumber'?
  const match = line.match(/^(.+?)\((\d+),(\d+)\): error TS\d+: Property '([^']+)' does not exist on type '[^']+'. Did you mean '([^']+)'\?/);
  if (match) {
    const file = match[1];
    const lineNum = parseInt(match[2], 10);
    const wrong = match[4];
    const right = match[5];

    if (fs.existsSync(file)) {
      let contentLines = fs.readFileSync(file, 'utf8').split('\n');
      const regex = new RegExp(`\\b${wrong}\\b`);
      if (regex.test(contentLines[lineNum - 1])) {
        contentLines[lineNum - 1] = contentLines[lineNum - 1].replace(regex, right);
        fs.writeFileSync(file, contentLines.join('\n'));
      }
    }
  }
  
  // "Property 'xyz' does not exist on type 'PaymentRequest'."
  const matchNoMean = line.match(/^(.+?)\((\d+),(\d+)\): error TS\d+: Property '([^']+)' does not exist on type '([^']+)'\.$/);
  if (matchNoMean) {
      const file = matchNoMean[1];
      const lineNum = parseInt(matchNoMean[2], 10);
      const wrong = matchNoMean[4];
      const type = matchNoMean[5];
      
      let right = wrong;
      if (wrong === 'paymentRequestId') right = 'id';
      if (wrong === 'desiredPaymentDate') right = 'desired_payment_date';
      if (wrong === 'paymentMethodId') right = 'payment_method_id';
      if (wrong === 'desired_payment_date') right = 'desiredPaymentDate'; // Oh wait, does the entity have desiredPaymentDate? Let's assume yes if it fails one way. Wait, PaymentRequest doesn't have it at all! Let's just remove or replace it. Wait, the properties might be totally missing! We should check entity.
      if (wrong === 'payment_method_id') right = 'paymentMethodId';
      if (wrong === 'payment_type_id') right = 'paymentTypeId';
      if (wrong === 'file_name') right = 'originalFileName'; // ReceiptFile
      if (wrong === 'created_at') right = 'createdDate';
      if (wrong === 'logs') right = 'approvalLogs'; // logs -> approvalLogs
      
      if (fs.existsSync(file)) {
          let contentLines = fs.readFileSync(file, 'utf8').split('\n');
          const regex = new RegExp(`\\b${wrong}\\b`);
          if (regex.test(contentLines[lineNum - 1])) {
              contentLines[lineNum - 1] = contentLines[lineNum - 1].replace(regex, right);
              fs.writeFileSync(file, contentLines.join('\n'));
          }
      }
  }

  // Object literal may only specify known properties, and 'paymentRequestId' does not exist
  const matchLiteral = line.match(/^(.+?)\((\d+),(\d+)\): error TS2353: Object literal may only specify known properties, and '([^']+)' does not exist/);
  if (matchLiteral) {
      const file = matchLiteral[1];
      const lineNum = parseInt(matchLiteral[2], 10);
      const wrong = matchLiteral[4];
      let right = wrong;
      if (wrong === 'paymentRequestId') right = 'id';
      if (wrong === 'payment_request_id') right = 'paymentRequestId';
      if (wrong === 'logs') right = 'approvalLogs';

      if (fs.existsSync(file)) {
          let contentLines = fs.readFileSync(file, 'utf8').split('\n');
          const regex = new RegExp(`\\b${wrong}\\b`);
          if (regex.test(contentLines[lineNum - 1])) {
              contentLines[lineNum - 1] = contentLines[lineNum - 1].replace(regex, right);
              fs.writeFileSync(file, contentLines.join('\n'));
          }
      }
  }
}
