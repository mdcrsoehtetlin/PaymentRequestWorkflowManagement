const fs = require('fs');
const logContent = fs.readFileSync('C:/Users/soehtetlin/.gemini/antigravity-ide/brain/794a6824-d5f8-460b-8da6-f03a78f890c0/.system_generated/tasks/task-299.log', 'utf8');

const lines = logContent.split('\n');
for (const line of lines) {
    const match = line.match(/^(.+?)\((\d+),(\d+)\): error TS\d+:/);
    if (match) {
        const file = match[1];
        const lineNum = parseInt(match[2], 10);
        
        let wrong = null;
        let right = null;

        const ts2551 = line.match(/Property '([^']+)' does not exist on type '[^']+'. Did you mean '([^']+)'\?/);
        if (ts2551) {
            wrong = ts2551[1];
            right = ts2551[2];
        }

        const ts2353 = line.match(/Object literal may only specify known properties, and '([^']+)' does not exist/);
        if (ts2353) {
            wrong = ts2353[1];
        }

        const ts2561 = line.match(/Object literal may only specify known properties, but '([^']+)' does not exist/);
        if (ts2561) {
            wrong = ts2561[1];
        }
        
        const ts2339 = line.match(/Property '([^']+)' does not exist on type '[^']+'/);
        if (ts2339 && !ts2551) {
            wrong = ts2339[1];
        }

        if (wrong) {
            if (!right) {
                if (wrong === 'status_id') right = 'statusId';
                if (wrong === 'updated_at') right = 'modifiedDate';
                if (wrong === 'is_deleted') right = 'isDeleted';
                if (wrong === 'applicant_user_id') right = 'applicantUserId';
                if (wrong === 'payment_request_id') right = 'paymentRequestId';
            }
            if (right) {
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
    }
}
