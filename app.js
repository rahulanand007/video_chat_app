const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const { renderMain } = require('./controller/userController')
const socket = require("socket.io")
const { socket_connection } = require('./socket')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))

app.use(express.static('public'))

app.get("/",renderMain)



app.set("view engine", "ejs")
app.set('views',"./views")


const server = app.listen(8800,()=>{
    console.log(`app listning on port ${8800}`)
})

socket_connection(server)



