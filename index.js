import express, { query } from 'express'
import cors from 'cors'
import { createServer } from 'http'
import mariadb from 'mariadb'
import jwt from 'jsonwebtoken'

const port = 3000
const secretKey = 'secret'

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const db = mariadb.createPool({
	host: 'localhost',
	user: 'root',
	password: '2402',
	database: 'pruebas',
	port: 3306,
	acquireTimeout: 10000,
	conexionLimit: 5
})

// function verifyToken(req, res, header){
// 	const header = req.header
// 	const token = header.split(" ")[0]
// 	if(!token){
// 		return res.status(401).json({message: "Token not provided"})
// 	}
// 	try{
// 		const payload = jwt.verify(token, secretKey)
// 		req.username =    
// 	}
// }

app.post('/api/login', (req, res) => {
	try{
		console.log('ejectutando')
		const { id, password } = req.body
		let connection = db.getConnection()
		// let query = connection.query('SELECT * FROM users')
		// console.log(query)
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}finally{
		connection.end()
	}
})

// app.post('/api/registerUser', verifyToken, (req, res) => {

// })

const server = createServer(app)
server.listen(port, () => {
	console.log('Su puerto es: 3000')
})	