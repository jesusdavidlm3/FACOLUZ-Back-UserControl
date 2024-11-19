import express, { query } from 'express'
import cors from 'cors'
import { createServer } from 'http'
import mariadb from 'mariadb'
import { Bearer } from 'permit'

const port = 3000

const permit = new Bearer({
	query: 'access_token'
})

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

async function createPool(){
	const db = mariadb.createPool({
			host: 'localhost',
			user: 'root',
			password: '2402',
			database: 'pruebas',
			port: 3306,
			acquireTimeout: 10000,
			conexionLimit: 5
		})

	let connection = await db.getConnection()

	let res = await connection.query('SELECT * FROM users')
	console.log(res)

	connection.end()

	const server = createServer(app)
	server.listen(port, () => {
		console.log('Su puerto es: 3000')
	})	
}

createPool()