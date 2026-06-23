const fs = require('fs');
const path = require('path');

// 1. Delete OneToMany decorators in user.entity.ts properly
const userEntityPath = path.join(__dirname, 'src', 'modules', 'shared', 'entities', 'user.entity.ts');
let userContent = fs.readFileSync(userEntityPath, 'utf-8');

// The file might contain multiline @OneToMany...
// Let's just remove everything from `@OneToMany` to the end of the file except the closing brace
userContent = userContent.replace(/@OneToMany[\s\S]*?(?=^})/m, '');
fs.writeFileSync(userEntityPath, userContent);

// 2. Fix ownership.guard.ts `isDeleted` to `is_deleted`
const guardPath = path.join(__dirname, 'src', 'modules', 'shared', 'guards', 'ownership.guard.ts');
let guardContent = fs.readFileSync(guardPath, 'utf-8');
guardContent = guardContent.replace(/isDeleted:/g, 'is_deleted:');
fs.writeFileSync(guardPath, guardContent);

console.log('Fixed final typescript errors');
