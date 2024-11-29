import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import jwt from 'jsonwebtoken'
import * as db from './dbConnection.js'

const port = process.env.PORT
const secret = process.env.SECRET

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

function verifyToken(req, res, next){
	try{
		const token = req.headers.authorization.split(" ")[1]
		const payload = jwt.verify(token, secret)
		if(Date().now > payload.exp){
			res.status(401).send('Sesion expirada')
		}
		next()
	}catch(err){
		return res.status(401).send('Token no válido');
	}
}

app.post('/api/login', async (req, res) => {
	const {identification, passwordHash} = req.body
	let dbResponse
	try{
		dbResponse = await db.login(req.body)
		if(dbResponse.length == 0){
			res.status(404).send('Usuario no encontrado')
		}else if(dbResponse[0].passwordSHA256 != passwordHash){
			res.status(401).send('Contraseña Incorrecta')
		}else if(dbResponse[0].active == false){
			res.status(404).send('Este usuario se encuentra inactivo')
		}else{
			const token = jwt.sign({
				id: dbResponse[0].id,
				name: dbResponse[0].name,
				type: dbResponse[0].type,
				exp: Date.now() + 600000
			}, secret)
			res.status(200).send({...dbResponse[0], jwt: token})
		}
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}
})

app.get('/api/getAllUsers', verifyToken, async (req, res) => {
	let dbResponse = await db.getAllUsers()
	res.status(200).send(dbResponse)
})

app.post('/api/createUser', verifyToken, async (req, res) => {
	try{
		let dbResponse = await db.createUser(req.body)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send('Error del servidor')
	}
})

app.delete('/api/deleteUser/:id', verifyToken, async (req, res) => {
	try{
		let dbResponse = await db.deleteUser(req.params.id)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}
})

const server = createServer(app)
server.listen(port, () => {
	console.log('Su puerto es: 3000')
})	