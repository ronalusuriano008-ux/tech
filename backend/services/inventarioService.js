// backend/services/inventarioService.js
const fileDB = require('../db/fileDB');

const getInventario = async () => await fileDB.findAll('inventario');
const createInventario = async (data) => await fileDB.create('inventario', data);
const updateInventario = async (id, data) => await fileDB.update('inventario', id, data);
const deleteInventario = async (id) => await fileDB.remove('inventario', id);

module.exports = { getInventario, createInventario, updateInventario, deleteInventario };