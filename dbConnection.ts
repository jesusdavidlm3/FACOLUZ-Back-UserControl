import mariadb from 'npm:mariadb'
import * as t from './interfaces.ts'
import "jsr:@std/dotenv/load";

const db = mariadb.createPool({
	host: Deno.env.get("BDD_HOST"),
	user: Deno.env.get("BDD_USER"),
	password: Deno.env.get("BDD_PASSWORD"),
	database: Deno.env.get("BDD_DATABASE"),
	port: Number(Deno.env.get("BDD_PORT")),
	acquireTimeout: Number(Deno.env.get("BDD_TIMEOUT")),
	connectionLimit: Number(Deno.env.get("BDD_CONECTION_LIMITS"))
})

async function query(query: string, params?: object) {
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(query, params)
		return res
	}catch(err){
		console.log(err)
		throw err
	}finally{
		connection?.release()
	}
}

async function execute(query: string, params?: object) {
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.execute(query, params)
		return res
	}catch(err){
		console.log(err)
		throw err
	}finally{
		connection?.release()
	}
}

export async function login(data: t.loginData){
	const {identification} = data
	const res = await query('SELECT * FROM users WHERE identification = ?', [identification])
	return res
}

export async function getAllUsers() {
	const res = await query('SELECT * FROM users WHERE active = 1')
	return res
}

export async function getDeactivatedUsers() {
	const res = await query('SELECT * FROM users WHERE active = 0')
	return res
}

export async function createUser(data: t.newUser, currentUser: string) {
	console.log(data)
	const {idType, idNumber, name, lastname, password, userType} = data
	const uid = crypto.randomUUID()
	const res = await query(`
		INSERT INTO users(id, name, lastname, passwordSHA256, type, identification, identificationType) VALUES(?, ?, ?, ?, ?, ?, ?)
	`, [uid, name, lastname, password, userType, idNumber, idType])
	generateLogs(0, uid, currentUser)
	return res
}

export async function deleteUser(id: string, currentUser: string){
	const res = await query("UPDATE users SET active = 0 WHERE id = ?", [id])
	generateLogs(1, id, currentUser)
	return res
}

export async function reactivateUser(data: {id: string, newPassword: string}, currentUser: string){
	const {id, newPassword} = data
	const res = await execute("UPDATE users SET active = 1, passwordSHA256 = ? WHERE id = ?", [newPassword, id])
	generateLogs(2, id, currentUser)
	return res
}

export async function changePassword(data: {userId: string, newPassword: string}, currentUser: string) {
	const {userId, newPassword} = data
	const res = await execute("UPDATE users SET passwordSHA256 = ? WHERE id = ?", [newPassword, userId])
	generateLogs(3, userId, currentUser)
	return res
}

export async function changeUserType(data: {userId: string, newType: 0 | 1 | 2 | 3}, currentUser: string) {
	const { userId, newType } = data
	const res = await execute("UPDATE users SET type = ? WHERE id = ?", [newType, userId])
	generateLogs(4, userId, currentUser)
	return res
}

async function generateLogs(changeType: 0 | 1 | 2 | 3 | 4, modificated: string, modificator: string){
	const uid = crypto.randomUUID()
	const dateTime = `${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()} ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`
	
	const _res = await execute(`
		INSERT INTO changelogs(id, changetype, datetime, usermodificatorId, usermodificatedId) VALUES(?, ?, ?, ?, ?)
	`, [uid, changeType, dateTime, modificator, modificated])
}

export async function getLogs() {
	const res = await query(`
		SELECT changelogs.dateTime, changelogs.changeType, modificated.name AS modificatedName, modificated.lastname AS modificatedLastname, modificator.name AS modificatorName, modificator.lastname AS modificatorLastname
		FROM changelogs
		JOIN users AS modificated ON changelogs.userModificatedId = modificated.id
		JOIN users AS modificator ON changelogs.userModificatorId = modificator.id
	`)
	return res
}