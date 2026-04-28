// backend/services/userService.js
const fileDB = require('../db/fileDB');

const getUsers = async () => await fileDB.findAll('users');
const getUserById = async (id) => await fileDB.findById('users', id);
const createUser = async (data) => await fileDB.create('users', data);
const updateUser = async (id, data) => await fileDB.update('users', id, data);
const deleteUser = async (id) => await fileDB.remove('users', id);

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };