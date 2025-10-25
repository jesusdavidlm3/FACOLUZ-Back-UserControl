import express from "npm:express@4.18.2";
import cors from 'npm:cors'
import jwt from 'npm:jsonwebtoken'
import * as db from './dbConnection.ts'
import * as tokenVerification from './tokenVerification.ts'
import "jsr:@std/dotenv/load";

const port = Deno.env.get("PORT")
const secret = Deno.env.get("SECRET")

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.post('/api/login', async (req, res) => {
	const {passwordHash} = req.body
	let dbResponse
	try{
		dbResponse = await db.login(req.body)
		if(dbResponse.length == 0){
			res.status(404).send('Usuario no encontrado')
		}else if(dbResponse[0].passwordSHA256 != passwordHash){
			res.status(401).send('Contraseña Incorrecta')
		}else if(dbResponse[0].active == false){
			res.status(404).send('Este usuario se encuentra inactivo')
		}else if(dbResponse[0].type != 0){
			res.status(401).send('Usted no es un administrador de sistemas')
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

app.get('/api/getAllUsers/:page', tokenVerification.forSysAdmins, async (req, res) => {
	const page = Number(req.params.page)
	const dbResponse = await db.getAllUsers(page)
	res.status(200).send(dbResponse)
})

app.get('/api/getSearchedUsers/:searchParam/:page', tokenVerification.forSysAdmins, async (req, res) => {
	const searchParam = req.params.searchParam
	const page = Number(req.params.page)
	try{
		const dbResponse = await db.getSearchedUsers(searchParam, page)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(404).send('Usuario no encontrado')
	}
})

app.get('/api/getSearchedSDeactivatedUsers/:searchParam/:page', tokenVerification.forSysAdmins, async (req, res) => {
	const searchParam = req.params.searchParam
	const page = Number(req.params.page)
	try{
		const dbResponse = await db.getSearchedSDeactivatedUsers(searchParam, page)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(404).send('Usuario no encontrado')
	}
})

app.get('/api/getDeactivatedUsers/:page', tokenVerification.forSysAdmins, async (req, res) => {
	const page = Number(req.params.page)
	const dbResponse = await db.getDeactivatedUsers(page)
	res.status(200).send(dbResponse)
})

app.get('/api/getIdUsers/:idParam', tokenVerification.forSysAdmins, async (req, res) => {
	const idParam = req.params.idParam
	try {
		const dbResponse = await db.getIdUsers(idParam)
		res.status(200).send(dbResponse)
	} catch (err) {
		console.log(err)
		res.status(404).send('Usuario no encontrado')
	}
})

app.post('/api/createUser', tokenVerification.forSysAdmins, async (req, res) => {
	const token = req.headers.authorization.split(" ")[1]
	const payload = jwt.verify(token, secret)
	try{
		const _dbResponse = await db.createUser(req.body, payload.id)
		res.status(200).send("Creado con exito")
	}catch(err){
		console.log(err)
		res.status(500).send('Error del servidor')
	}
})

app.delete('/api/deleteUser/:id', tokenVerification.forSysAdmins, async (req, res) => {
	const token = req.headers.authorization.split(" ")[1]
	const payload = jwt.verify(token, secret)
	try{
		const _dbResponse = await db.deleteUser(req.params.id, payload.id)
		res.status(200).send("Borrado con exito")
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}
})

app.patch('/api/reactivateUser', tokenVerification.forSysAdmins, async (req, res) => {
	console.log(req.body)
	const token = req.headers.authorization.split(" ")[1]
	const payload = jwt.verify(token, secret)
	try{
		const _dbResponse = await db.reactivateUser(req.body, payload.id)
		res.status(200).send("Usuario reactivado")
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}
})

app.patch('/api/changePassword', tokenVerification.forSysAdmins, async (req, res) => {
	const token = req.headers.authorization.split(" ")[1]
	const payload = jwt.verify(token, secret)
	try{
		const _dbResponse = await db.changePassword(req.body, payload.id)
		res.status(200).send("Contraseña cambiada")
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}
})

app.patch('/api/changeUserType', tokenVerification.forSysAdmins, async (req, res) => {
	const token = req.headers.authorization.split(" ")[1]
	const payload = jwt.verify(token, secret)
	try{	
		const _dbResponse = await db.changeUserType(req.body, payload.id)
		res.status(200).send("Usuario actualizado")
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}
})

app.get('/api/getAllChangeLogs/:page', tokenVerification.forSysAdmins, async (req, res) => {
	try{
		const page: number = Number(req.params.page)
		const dbResponse = await db.getLogs(page)
		res.status(200).send(dbResponse)
	}catch(err){
		console.log(err)
		res.status(500).send('error del servidor')
	}
})

app.listen(port, "0.0.0.0", () => {
	console.log(`Puerto: ${port}`)
})