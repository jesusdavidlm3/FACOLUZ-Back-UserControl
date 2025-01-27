import mariadb from 'mariadb'
import { v4 as UIDgenerator } from 'uuid';


const db = mariadb.createPool({
	host: process.env.BDD_HOST,
	user: process.env.BDD_USER,
	password: process.env.BDD_PASSWORD,
	database: process.env.BDD_DATABASE,
	port: process.env.BDD_PORT,
	acquireTimeout: process.env.BDD_TIMEOUT,
	conexionLimit: process.env.BDD_CONECTION_LIMITS
})

export async function login(data){
	const {identification, passwordHash} = data
	let connection
	try{
		connection = await db.getConnection()
		const user = await connection.query('SELECT * FROM users WHERE identification = ?', [identification])
		return user
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function getAllUsers() {
	let connection
	try{
		connection = await db.getConnection()
		const list = await connection.query('SELECT * FROM users WHERE active = 1')
		return list
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function getDeactivatedUsers() {
	let connection
	try{
		connection = await db.getConnection()
		const list = await connection.query('SELECT * FROM users WHERE active = 0')
		return list
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function createUser(data, currentUser) {
	console.log(data)
	const {idType, idNumber, name, lastname, password, userType} = data
	const uid = UIDgenerator()
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			INSERT INTO users(id, name, lastname, passwordSHA256, type, identification, identificationType) VALUES(?, ?, ?, ?, ?, ?, ?)
		`, [uid, name, lastname, password, userType, idNumber, idType])
		generateLogs(0, uid, currentUser)
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function deleteUser(id, currentUser){
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			UPDATE users SET active = 0 WHERE id = ?
		`, [id])
		generateLogs(1, userId, currentUser)
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function reactivateUser(data, currentUser){
	const {id, newPassword} = data
	console.log(data)
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			UPDATE users SET active = 1, passwordSHA256 = ? WHERE id = ?
		`, [newPassword, id])
		generateLogs(2, id, currentUser)
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function changePassword(data, currentUser) {
	const {userId, newPassword} = data
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			UPDATE users SET passwordSHA256 = ? WHERE id = ?
		`, [newPassword, userId])
		generateLogs(3, userId, currentUser)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function changeUserType(data, currentUser) {
	const { userId, newType } = data
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			UPDATE users SET type = ? WHERE id = ?
		`, [newType, userId])
		generateLogs(4, userId, currentUser)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

async function generateLogs(changeType, modificated, modificator){
	let connection
	const uid = UIDgenerator()
	const dateTime = `${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()} ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			INSERT INTO changelogs(id, changetype, datetime, usermodificatorId, usermodificatedId) VALUES(?, ?, ?, ?, ?)
		`, [uid, changeType, dateTime, modificator, modificated])
	}catch(err){
		console.log(err)
	}finally{
		connection.release()
	}
}

export async function getLogs() {
	let connection
	try{
		connection = await db.getConnection()
		const list = await connection.query(`
			SELECT changelogs.dateTime, changelogs.changeType, modificated.name AS modificatedName, modificated.lastname AS modificatedLastname, modificator.name AS modificatorName, modificator.lastname AS modificatorLastname
			FROM changelogs
			JOIN users AS modificated ON changelogs.userModificatedId = modificated.id
			JOIN users AS modificator ON changelogs.userModificatorId = modificator.id
		`)
		return list
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}