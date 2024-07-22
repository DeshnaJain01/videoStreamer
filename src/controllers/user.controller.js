import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

//generating access and refresh token
const generateAccessAndRefreshTokens = async(userId)=>
{
    try {
        //find by id whose access and refresh token we need to create 
        const user = await User.findById(userId)
        //generate access and refresh token of that user
        const accessToken= user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        // now access token and refresh token given to user but refresh token is saved in db also
        user.refreshToken=refreshToken //added this object in user 
        await user.save({validateBeforeSave:false})// this validation field check is imposed because save is a mongoose method so every time we save it will be kicked in for other field as well so to avoid that we use validateBeforeSave field and mark is as false 
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating referesh and access token")
        
    }
}
//...registering user 
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
//...logining user 
const loginUser=asyncHandler(async(req,res)=>{
    // requesting data from body   
    //username or password 
    // find user 
    //check password
    // generate access token and refresh token 
    // send cookie 
    //  send a response of logged in successfully 

    //1. got email or password from request body
    const {email,username,password}=req.body
    //email or username is required
    //if(!(username|| email))
    if(!username && !email){
        throw new ApiError(400,"username or password is required")  
    }
    //2. check  if user exist in the db or not ?
    const user=await User.findOne({
        $or: [{username},{email}]
    })

    // if user not found then 
    if (!user){
        throw new ApiError(404,"User Does not exist")
    }
    //3.check if the password provided is correct from the user returned from req body 
    const isPasswordValid= await user.isPasswordCorrect(password)
    //if password is incorrect 
    if (!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials ")
    }
    //4.call access and refresh token method that u made in the top because it is going to be used number of times 
    const {accessToken, refreshToken}=await generateAccessAndRefreshTokens(user._id)
    //now either update the user with refresh and access token
    //or we can simply we can call db 
   const loggedInUser= await User.findById(user._id).
   select("-password -refreshToken")

   //5.  now we gotta send cookies 
   //so first we have to design somee objects
   const options ={
    httpOnly:true,
    secure:true
   }
   // now return the response 
   return res
        .status(200)
        .cookie("accessToken", accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    user:loggedInUser,accessToken,refreshToken
                },
                "User logged in Successfully"
            )
        )
})

//... logout user

const logOutUser = asyncHandler(async(req,res)=>{
    await  User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new: true
        }
    )
    const options ={
        httpOnly:true,
        secure:true
       }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{}, "User Logged Out"))

    
})



 



export {registerUser, loginUser, logOutUser}