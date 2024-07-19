import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const registerUser= asyncHandler(async (req,res)=>{
    

    //1. get user details from frontend
   const {fullName, email, username, password}= req.body
   // console.log("email:", email);
   //2.check if any field is empty
   if (

        [fullName, email, username, password].
        some((field)=> field?.trim()==="")
    )
    //if any field is empty then throw error
    {
        throw new ApiError(400,"All fields are required")
    }
    //3.check if user already exists
    const existedUser= await User.findOne({
        $or:[{username},{email}]
    })

    if (existedUser){
        throw new ApiError (409, "User with username or email already exists")
    }

    //4. check for images and avatar
   const avatarLocalPath= req.files?.avatar[0]?.path;
   //const coverImageLocalPath=req.files?.coverImage[0]?.path; 
   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath = req.files.coverImage[0].path
   }
   //check if have avatar image ... cover image is not compulsory... but avatar image is ....
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required localPathNotFound")
    }

    // upload image or file on cloudinary
const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage= await uploadOnCloudinary(coverImageLocalPath)
 // check if your file uploaded successfully

 if (!avatar){
    throw new ApiError(400,"Avatar file is required last call")

 }

 //create user object -entry to db

 const user= await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()

    })

    //find if user created 
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //check if user create
    if (!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")

    }
    //return response 

    return res.status(201).json(
        new ApiResponse(200,createdUser, "User registered successfully!")
    ) 
})



 



export {registerUser}