import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import jwt from 'jsonwebtoken'
import * as db from './dbConnection.js'
import { v4 as UIDgenerator } from 'uuid';

const port = process.env.PORT
const secret = process.env.SECRET

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.post('/api/login', async (req, res) => {
	const {identification, passwordHash} = req.body
	let dbResponse
	try{
		dbResponse = await db.login(req.body)
		if(dbResponse.length == 0){
			res.status(404).send('Usuario no encontrado')
		}else if(dbResponse[0].passwordSHA256 != passwordHash){
			res.status(401).send('Contraseña Incorrecta')
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

app.get('/api/getAllUsers', (req, res) => {
	const token = req.headers.authorization.split(" ")[1]
	const payload = jwt.verify(token, secret)

	if(Date().now > payload.exp){
		res.status(401).send('Sesion expirada')
	}else{
		let dbResponse
		
	}
})

const server = createServer(app)
server.listen(port, () => {
	console.log('Su puerto es: 3000')
})	