const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

function createCollectionStore(options = {}) {
    const backendRoot = options.backendRoot || path.join(__dirname, '..');
    const dataDir = options.dataDir || path.join(backendRoot, 'data');

    const ensureDataDir = async () => {
        try {
            await fs.access(dataDir);
        } catch {
            await fs.mkdir(dataDir, { recursive: true });
        }
    };

    const ensureFile = async (collection) => {
        const filePath = path.join(dataDir, `${collection}.json`);
        try {
            await fs.access(filePath);
        } catch {
            await ensureDataDir();
            await fs.writeFile(filePath, '[]', 'utf-8');
        }
        return filePath;
    };

    const atomicWrite = async (filePath, data) => {
        await ensureDataDir();
        const tempPath = `${filePath}.tmp`;
        await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
        await fs.rename(tempPath, filePath);
    };

    return {
        async findAll(collection) {
            const filePath = await ensureFile(collection);
            const data = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(data);
        },

        async findById(collection, id) {
            const data = await this.findAll(collection);
            return data.find((item) => item.id === id) || null;
        },

        async create(collection, item) {
            const data = await this.findAll(collection);
            const newItem = {
                id: uuidv4(),
                ...item,
                fechaRegistro: new Date().toISOString()
            };
            data.push(newItem);
            const filePath = path.join(dataDir, `${collection}.json`);
            await atomicWrite(filePath, data);
            return newItem;
        },

        async update(collection, id, updates) {
            const data = await this.findAll(collection);
            const index = data.findIndex((item) => item.id === id);
            if (index === -1) return null;
            data[index] = { ...data[index], ...updates, id };
            const filePath = path.join(dataDir, `${collection}.json`);
            await atomicWrite(filePath, data);
            return data[index];
        },

        async remove(collection, id) {
            let data = await this.findAll(collection);
            const initialLength = data.length;
            data = data.filter((item) => item.id !== id);
            if (data.length === initialLength) return false;
            const filePath = path.join(dataDir, `${collection}.json`);
            await atomicWrite(filePath, data);
            return true;
        }
    };
}

const fileCollectionStore = createCollectionStore();
module.exports = fileCollectionStore;
module.exports.createCollectionStore = createCollectionStore;
