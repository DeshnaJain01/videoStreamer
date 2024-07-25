import {Router} from "express"
import { ChangeCurrentPassword,
     deleteUserAvatar, 
     getCurrentUser, 
     getUserChannelProfile,
     getWatchHistory,
     loginUser,
     logOutUser, 
     refreshAccessToken, 
     registerUser, 
     updateAccountDetails, 
     updateUserAvatar, 
     updateUserCoverImage } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router =  Router()

router.route("/register").post(
    //middleware used to upload files
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }

    ]),
    registerUser)
router.route("/login").post(loginUser)
//secured route using middleware
router.route("/logout").post(verifyJWT, logOutUser)
//session expired 401 req hits this end point for regenerate refresh access token
router.route("/refresh-token").post(refreshAccessToken)
//change password
router.route("/change-password").post(verifyJWT,ChangeCurrentPassword)
//get me current user
router.route("/current-user").get(verifyJWT,getCurrentUser)
//updating account details 
router.route("/update-account-details").patch(verifyJWT,updateAccountDetails)
//updating user avatar
router.route("/update-user-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
//update user cover image
router.route("/update-user-cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
//delete user avatar
router.route("/delete-user-avatar").delete(verifyJWT,deleteUserAvatar)
//to get user channel profile-followers, subscribers etc
router.route("/channel/:username").get(verifyJWT,getUserChannelProfile)
//get watch history
router.route("/history").get(verifyJWT,getWatchHistory)


export default router