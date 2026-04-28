// backend/db/fileDB.js
const fs = require('fs').promises;
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');

const ensureFile = async (collection) => {
    const filePath = path.join(DB_DIR, `${collection}.json`);
    try {
        await fs.access(filePath);
    } catch (error) {
        await fs.writeFile(filePath, '[]', 'utf-8');
    }
    return filePath;
};

const fileDB = {
    async findAll(collection) {
        const filePath = await ensureFile(collection);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    },
    async findById(collection, id) {
        const data = await this.findAll(collection);
        return data.find(item => item.id === id) || null;
    },
    async create(collection, item) {
        const data = await this.findAll(collection);
        const newItem = { id: require('uuid').v4(), ...item, fechaRegistro: new Date().toISOString() };
        data.push(newItem);
        const filePath = path.join(DB_DIR, `${collection}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return newItem;
    },
    async update(collection, id, updates) {
        const data = await this.findAll(collection);
        const index = data.findIndex(item => item.id === id);
        if (index === -1) return null;
        data[index] = { ...data[index], ...updates, id };
        const filePath = path.join(DB_DIR, `${collection}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return data[index];
    },
    async remove(collection, id) {
        let data = await this.findAll(collection);
        const initialLength = data.length;
        data = data.filter(item => item.id !== id);
        if (data.length === initialLength) return false;
        const filePath = path.join(DB_DIR, `${collection}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    }
};

module.exports = fileDB;