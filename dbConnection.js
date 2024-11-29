import mariadb from 'mariadb'
import { v4 as UIDgenerator } from 'uuid';


const db = mariadb.createPool({
	host: 'localhost',
	user: 'root',
	password: '2402',
	database: 'faco-luz',
	port: 3306,
	acquireTimeout: 10000,
	conexionLimit: 5
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

export async function createUser(data) {
	console.log(data)
	const {idType, idNumber, name, lastname, password, userType} = data
	const uid = UIDgenerator()
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			INSERT INTO users(id, name, lastname, passwordSHA256, type, identification, identificationType) VALUES(?, ?, ?, ?, ?, ?, ?)
		`, [uid, name, lastname, password, userType, idNumber, idType])
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function deleteUser(id){
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			UPDATE users SET active = 0 WHERE id = ?
		`, [id])
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

export async function reactivateUser(data){
	const {id, newPassword} = data
	console.log(data)
	let connection
	try{
		connection = await db.getConnection()
		const res = await connection.query(`
			UPDATE users SET active = 1, passwordSHA256 = ? WHERE id = ?
		`, [newPassword, id])
		console.log(res)
	}catch(err){
		return err
	}finally{
		connection.release()
	}
}

// export async function editUser(data) {
// 	const {  } = data
// }