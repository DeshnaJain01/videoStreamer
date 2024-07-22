import { ApiError } from "../utils/ApiError"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
export const verifyJWT = asyncHandler(async(req,_,next)=>{
    try {
        //token access...its easy bcz request have cookies access
        const token= req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(401,"Unauthorized request")
    
        }
      //verifying the token 
        const decodedToken= jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        //database request and check whether user with the id provided by access token exist?
        const user= await User.findById(decodedToken?._id).select
        ("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }
        //we have access of request so in that we will add a new object in that 
        req.user=user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message||"Invalid access token")
        
    }
})