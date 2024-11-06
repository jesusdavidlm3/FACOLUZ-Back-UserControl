import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import mariadb from 'mariadb'

const port = 3000

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))

const db = mariadb.createPool({
	host: 'localhost',
	user: '',
	password: '',
	database: 'Odontologia',
	port: 3307
})

app.post('/api/login', (req, res) => {
	
})


const server = createServer(app)
server.listen(port, () => {
	console.log('Su puerto es: 3000')
})