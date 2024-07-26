import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import {CloudinaryAvatar, CloudinaryCoverImage} from "../models/cloudinary.model.js"
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
        return res.status(500).json(new ApiError(500,"Something went wrong while generating referesh and access token"))
        
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
        return res.status(400).json(new ApiError(400,"All fields are required"))
    }
    //3.check if user already exists
    const existedUser= await User.findOne({
        $or:[{username},{email}]
    })

    if (existedUser){
        return res.status(409).json(new ApiError (409, "User with username or email already exists"))
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
        return res.status(400).json(new ApiError(400,"Avatar file is required localPathNotFound"))
        }

    // upload image or file on cloudinary
const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage= await uploadOnCloudinary(coverImageLocalPath)
 // check if your file uploaded successfully

 if (!avatar){
    return res.status(400).json(new ApiError(400,"Avatar file is required last call"))
     

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
    //create avatar table in the db
const cloudinaryAvatar=await CloudinaryAvatar.create({
    userId:user._id,
    cloudinary_id: avatar.public_id,
    cloudinary_secureUrl:avatar.secure_url
})
 //create avatar table in the db
 const cloudinaryCoverImage=await CloudinaryCoverImage.create({
    userId:user._id,
    cloudinary_id: coverImage.public_id,
    cloudinary_secureUrl:coverImage.secure_url
})
    //find if user created 
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //check if user create
    if (!createdUser){
        return res.status(500).json(new ApiError(500, "Something went wrong while registering the user"))
         

    }
    if (!cloudinaryAvatar){
        return res.status(500).json(new ApiError(500, "Something went wrong while pushing the avatar to db the user"))
         

    }
    if (!cloudinaryCoverImage){
        return res.status(500).json(new ApiError(500, "Something went wrong while pushing the cover Image to  the user"))
         

    }
    //return response 

    return res.status(201).json(
        new ApiResponse(200,{createdUser,cloudinaryAvatar, cloudinaryCoverImage}, "User registered successfully!")
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
        return res.status(400).json(new ApiError(400,"username or password is required"))  
    }
    //2. check  if user exist in the db or not ?
    const user=await User.findOne({
        $or: [{username},{email}]
    })

    // if user not found then 
    if (!user){
        return res.status(404).json(new ApiError(404,"User Does not exist"))
    }
    //3.check if the password provided is correct from the user returned from req body 
    const isPasswordValid= await user.isPasswordCorrect(password)
    //if password is incorrect 
    if (!isPasswordValid){
        return res.status(401).json(new ApiError(401,"Invalid user credentials "))
    }
    //4.call access and refresh token method that u made in the top because it is going to be used number of times 
    const {accessToken, refreshToken}=await generateAccessAndRefreshTokens(user._id)
    //now either update the user with refresh and access token
    //or we can simply we can call db 
   const loggedInUser= await User.findById(user._id).
   select("-password -refreshToken")
   user.refreshToken=refreshToken //added this object in user 
        await user.save({validateBeforeSave:false})

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
                    user:loggedInUser
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
            $unset:{
                refreshToken:1//this removes the field from document
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

//... refreshAccessToken when session expired
const refreshAccessToken=asyncHandler(async(req,res)=>{
    //access refresh token from cookies
    const incomingRefreshToken = req.cookies.
        refreshToken || req.body.refreshToken
    if (!incomingRefreshToken){
        return res.status(401).json(new ApiError(401, "Unauthorized Request"))
    }
    //decode the token 
    try {
        const decodedToken=jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET)
        // the token we got have a info which is id (can be accessed now)
        //with the help of this id we can make a db query
        // we can get the info if user 
         const user = await User.findById(decodedToken?._id)  
         if (!user){
            return res.status(401).json(new ApiError(401, "invalid refresh token"))
        }
        //if the user is matched then we gotta check whether refresh token matches or not 
        if (incomingRefreshToken!==user?.refreshToken){
            return res.status(401).json(new ApiError(401,"Refresh token is expired or used"))
        }
        //to send in cookies we need to make a options
        const options={
            httpOnly:true,
            secure:true
        }
        //now generate new refresh and access  tokens
        const {accessToken, newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, newRefreshToken},
                "Access Token refreshed"
     ) )
    
    } catch (error) {
        return res.status(401).json(new ApiError(401,error?.message||"Invalid refresh token")) 
    }
    

})
//....update or changing the password
const ChangeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword}=req.body
    //user id from db 
    //console.log("************ user", User);
    const user= await User.findById(req.user?._id)
  //  console.log("************ user", user);
    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        return res.staus(400).json(new ApiError(400, "invalid old password"))
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
    })
    //....get the current user 
    const getCurrentUser=asyncHandler(async(req,res)=>{
        return res.status(200)
        .json(200, req.user,"current user fetched successfully")
    })

    //....updation of user detail 
    const updateAccountDetails= asyncHandler(async(req,res)=>{
        console.log(typeof req.body)
        console.log(req.body)
        const {fullName, email} = req.body
        console.log(fullName, email)
        if (!fullName && !email){
            return res.status(400).json(new ApiError(400,"Atleast one field is required"))

        }
        console.log("Testtttt")
        console.log(req.user)
        //find user and chain select to remove password
       const user= User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    fullName,
                    email
                }
            },
            { 
                new:true
            }
        )

        User.findByIdAndUpdate( req.user?._id,{
            fullName,
            email
        }, 
            function (err, docs) { 
            if (err){ 
            console.log(err) 
            } 
            else{ 
                return res.status(200)
                .json(new ApiResponse (200, docs,"Account updated successfully" ))
            } 
            }); 

        // const user = {}
        // console.log(user)
        // return res.status(200)
        // .json(new ApiResponse (200, user,"Account updated successfully" ))


    })
    //...updating file or we call it avatar 
    const updateUserAvatar = asyncHandler(async(req,res)=>{
        
        // get the file first 
        const avatarLocalPath=req.file?.path
        if(!avatarLocalPath){
            return res.status(400).json(new ApiError(400,"Avatar file is missing "))
        }
        //upload  the new avatar cloudinary 
        const avatar = await uploadOnCloudinary
            (avatarLocalPath)
        if (!avatar.url){
            return res.status(400).json(new ApiError (400,"Error while uploading on avatar"))

        }
        //update the new avatar in db
        const user= await User.findByIdAndUpdate(
           req.user?._id,
            {
                $set :{
                    avatar:avatar.url,
                    cloudinary_id: avatar.public_id,
                    cloudinary_secureId:avatar.secure_url
                }
            },
            {new:true}
        ).select("-password")
        //update the new avatar info of cloudinary in db
        const cloudinaryAvatar= await CloudinaryAvatar.findByIdAndUpdate(
            req.cloudinaryAvatar?.userId,
             {
                 $set :{
                    
                     cloudinary_id: avatar.public_id,
                     cloudinary_secureId:avatar.secure_url
                 }
             },
             {new:true}
         )
      
         return res 
        .status(200)
        .json(
            new ApiResponse(200, {user, cloudinaryAvatar }, "Avatar  updated Successfully")
        )

    })
   
    //...updating cover image 
    const updateUserCoverImage = asyncHandler(async(req,res)=>{
        // get the file of coverImage first 
        const coverImageLocalPath=req.file?.path
        if(!coverImageLocalPath){
            return res.status(400).json(new ApiError(400,"cover Image file is missing "))
        }
        //upload  the new coverImge cloudinary 
        const coverImage = await uploadOnCloudinary
            (coverImageLocalPath)
        if (!coverImage.url){
            return res.status(400).json(new ApiError (400,"Error while uploading on coverImage"))

        }
        //update the new coverImage in db
        const user=await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set :{
                    coverImage:coverImage.url,
                    
                }
            },
            {new:true}
        ).select("-password")
        const cloudinaryCoverImage= await CloudinaryCoverImage.findByIdAndUpdate(
            req.cloudinaryCoverImage?.userId,
             {
                 $set :{
                    
                     cloudinary_id: coverImage.public_id,
                     cloudinary_secureId:coverImage.secure_url
                 }
             },
             {new:true}
         )
        return res 
        .status(200)
        .json(
            new ApiResponse(200, {user, cloudinaryCoverImage}, "CoverImage updated Successfully")
        )

    })
    //.... deleting the avatar image
    const deleteUserAvatar=asyncHandler(async(req,res)=>{
        const user= await User.findById(
            req.user?.cloudinary_id)
            if(!cloudinary_id){
                return res.status(404).json(new ApiError(404,"Image not found"))
            }
            const deleteAvatar= await deleteOnCloudinary
            if(!deleteAvatar){
                return res.status(400).json(new ApiError(400,"Error while deleting the avatar"))
            }
        //delete the old avatar from db
        const userAfterImageDeleted=await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set :{
                    avatar:"",
                    cloudinary_id: "",
                    cloudinary_secureId:""
                }
            },
            {new:true}
        ).select("-password")

        return res 
        .status(200)
        .json(
            new ApiResponse(200, user, "avatar deleted Successfully")
        )
    })

    //...user channel info like no.of subcriber or subscribed
    const getUserChannelProfile=asyncHandler(async(req,res)=>{
        const {username}=req.params
        if (!username?.trim()){
            return res.status(400).json(new ApiError(400,"Username is missing "))
        }
        //pipeline
        const channel= await User.aggregate([
            //match user
            {
                $match:{
                    username:username?.toLowerCase()
                }
            },  
            //counted the no. of subscriber through channel
            {
                $lookup:{
                    from:"subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as:"subscribers"

                }
            },
            //counted the no. of channels subscribed through you being subscriber
            {
                $lookup:{
                    from:"subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as:"subscribedTo"
                }
            },
            //adding more fields in the original user object
            {
                $addFields:{
                    subscribersCount:{
                        $size:"$subscribers"
                    },
                    channelsSubscribedToCount:{
                        $size:"$subscribedTo"
                    },
                    isSubscribed:{
                        $cond:{
                            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                            then:true,
                            else:false
                        }
                    }
                },
                //what to include
                $project:{
                    fullName:1,
                    username:1,
                    subscribersCount:1,
                    channelsSubscribedToCount:1,
                    isSubscribed:1,
                    avatar:1,
                    coverImage:1,
                    email:1


                }
            }    

        ])
        //channel 
        if (!channel?.length){
            return res.status(404).json(new ApiError(404,"channel does not exists"))
        }
        return res.status(200)
        .json(new ApiResponse(200,channel[0],"User channel fetched successfully")) 

    })

    const getWatchHistory = asyncHandler(async(req,res)=>{
       const user= await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[{
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[{
                            $project:{
                                fullName:1,
                                username:1,
                                avatar:1
                            }
                        }]
                    }
                },
            {
               $addFields:{
                owner:{
                    $first:"$owner"
                }
               } 
            }]

            }
        }

       ])

       return res.status(200)
       .json(new ApiResponse(200,user[0].watchHistory,
        "Watch History fetched successfully"
       ))
    })



export {registerUser,
        loginUser, 
        logOutUser, 
        refreshAccessToken, 
        ChangeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        deleteUserAvatar,
        getUserChannelProfile,
        getWatchHistory
        
    }