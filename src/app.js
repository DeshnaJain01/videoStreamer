import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}))
//limiting data
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
//public access of item stores in our public folder
app.use(express.static("public"))
//keeping secure cookies on users browser and allow access of cookies
app.use(cookieParser())
//routes import 
import userRouter from './routes/user.routes.js'
 
//routes declaration
app.use("/api/v1/users",userRouter)
//http://localhost:8000/api/v1/users
  
export { app }