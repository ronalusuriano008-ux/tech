const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'data');
const usersFile = path.join(dataDir, 'user.json');
const legacyUsersFile = path.join(dataDir, 'users.json');

// Encriptación simple usando PBKDF2 de Node.js
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const newHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === newHash;
}

async function ensureDataDir() {
    try { await fs.access(dataDir); } 
    catch { await fs.mkdir(dataDir, { recursive: true }); }
}

// Crear usuario admin por defecto si no existe users.json
async function seedAdminUser() {
    await ensureDataDir();
    try {
        const data = await fs.readFile(usersFile, 'utf8');
        const users = JSON.parse(data);
        if (Array.isArray(users) && users.length > 0) {
            console.log('📂 Archivo user.json encontrado con usuarios.');
            return;
        }
    } catch {}

    // If legacy users.json exists and has users, migrate it
    try {
        const data = await fs.readFile(legacyUsersFile, 'utf8');
        const users = JSON.parse(data);
        if (Array.isArray(users) && users.length > 0) {
            await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf8');
            console.log('🔁 Migrado users.json → user.json');
            return;
        }
    } catch {}

    // Create default admin user
    const adminUser = {
        username: 'admin',
        password: hashPassword('admin123')
    };
    await fs.writeFile(usersFile, JSON.stringify([adminUser], null, 2), 'utf8');
    console.log('🌱 Usuario admin seed creado en user.json (admin / admin123).');
}

async function getUsers() {
    const data = await fs.readFile(usersFile, 'utf8');
    return JSON.parse(data);
}

async function findUser(username) {
    const users = await getUsers();
    return users.find(u => u.username === username);
}

module.exports = { seedAdminUser, findUser, verifyPassword };
