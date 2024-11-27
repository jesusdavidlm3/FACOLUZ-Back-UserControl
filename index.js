import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import jwt from 'jsonwebtoken'
import * as db from './dbConnection.js'

const port = 3000
const secretKey = 'secret'

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
			res.status(200).send(dbResponse[0])
		}
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}
})

const server = createServer(app)
server.listen(port, () => {
	console.log('Su puerto es: 3000')
})	