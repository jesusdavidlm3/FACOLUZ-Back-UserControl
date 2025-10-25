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
	const id = data.id
	console.log(id)
	const res = await query('SELECT * FROM users WHERE id = ?', [id])
	return res
}

export async function getAllUsers(page: number) {
	const res = await query('SELECT * FROM users WHERE active = 1 LIMIT 10 OFFSET ?', [(page-1)*10])
	return res
}

export async function getSearchedUsers(searchParam: string, page: number){	
	const searchParamWith = `${searchParam}%`
	if (isNaN(Number(searchParam))) {
		const res = await query(`
			SELECT * FROM users
			WHERE active = 1 AND (name LIKE ? OR lastname LIKE ?)
			LIMIT 10 OFFSET ?
		`, [ searchParamWith, searchParamWith, (page-1)*10])
		return res	
	} else {
		const res = await query(`
			SELECT * FROM users
			WHERE active = 1 AND id LIKE ?
			LIMIT 10 OFFSET ?
		`, [Number(searchParam), (page-1)*10])
		return res
	}
}

export async function getSearchedSDeactivatedUsers(searchParam: string, page: number){	
	const searchParamWith = `${searchParam}%`
	if (isNaN(Number(searchParam))) {
		const res = await query(`
			SELECT * FROM users
			WHERE active = 0 AND (name LIKE ? OR lastname LIKE ?)
			LIMIT 10 OFFSET ?	
		`, [ searchParamWith, searchParamWith, (page-1)*10])
		return res	
	} else {
		const res = await query(`
			SELECT * FROM users
			WHERE active = 0 AND id LIKE ?
			LIMIT 10 OFFSET ?
		`, [Number(searchParam), (page-1)*10])
		return res
	}
}

export async function getDeactivatedUsers(page: number) {
	const res = await query('SELECT * FROM users WHERE active = 0 LIMIT 10 OFFSET ?', [(page-1)*10])
	return res
}

export async function getIdUsers(idParam: number) {
	const res = await query('SELECT * FROM users WHERE id = ?', [idParam])
	return res
}

export async function createUser(data: t.newUser, currentUser: number) {
	const {id, idType, name, lastname, password, userType} = data
	const res = await query(`
		INSERT INTO users(id, name, lastname, passwordSHA256, type, identificationType) VALUES(?, ?, ?, ?, ?, ?)
	`, [id, name, lastname, password, userType, idType])
	generateLogs(0, id, currentUser)
	return res
}

export async function deleteUser(id: number, currentUser: number){
	const res = await query("UPDATE users SET active = 0 WHERE id = ?", [id])
	generateLogs(1, id, currentUser)
	return res
}

export async function reactivateUser(data: {id: number, newPassword: string}, currentUser: number){
	const {id, newPassword} = data
	const res = await execute("UPDATE users SET active = 1, passwordSHA256 = ? WHERE id = ?", [newPassword, id])
	generateLogs(2, id, currentUser)
	return res
}

export async function changePassword(data: {userId: number, newPassword: string}, currentUser: number) {
	const {userId, newPassword} = data
	const res = await execute("UPDATE users SET passwordSHA256 = ? WHERE id = ?", [newPassword, userId])
	generateLogs(3, userId, currentUser)
	return res
}

export async function changeUserType(data: {userId: number, newType: 0 | 1 | 2 | 3}, currentUser: number) {
	const { userId, newType } = data
	const res = await execute("UPDATE users SET type = ? WHERE id = ?", [newType, userId])
	generateLogs(4, userId, currentUser)
	return res
}

async function generateLogs(changeType: 0 | 1 | 2 | 3 | 4, modificated: number, modificator: number){
	const uid = crypto.randomUUID()
	const dateTime = `${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()} ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`
	
	const _res = await execute(`
		INSERT INTO changelogs(id, changetype, datetime, usermodificatorId, usermodificatedId) VALUES(UNHEX(REPLACE(?, '-', '')), ?, ?, ?, ?)
	`, [uid, changeType, dateTime, modificator, modificated])
}

export async function getLogs(page: number) {
	const res = await query(`
		SELECT
			changelogs.dateTime,
			changelogs.changeType,
			modificated.name AS modificatedName,
			modificated.lastname AS modificatedLastname,
			modificator.name AS modificatorName,
			modificator.lastname AS modificatorLastname
		FROM changelogs
		JOIN users AS modificated ON changelogs.userModificatedId = modificated.id
		JOIN users AS modificator ON changelogs.userModificatorId = modificator.id
		ORDER BY changelogs.dateTime DESC
		LIMIT 10 OFFSET ?
	`, [(page-1)*10])
	return res
}