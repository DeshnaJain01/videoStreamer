import {Router} from "express"
import { ChangeCurrentPassword, deleteUserAvatar, getUserChannelProfile, loginUser, logOutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js"
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
//updating account details 
router.route("/update-account-details").post(updateAccountDetails)
//updating user avatar
router.route("/update-user-avatar").post(updateUserAvatar)
//update user cover image
router.route("/update-user-cover-image").post(updateUserCoverImage)
//delete user avatar
router.route("/delete-user-avatar").post(deleteUserAvatar)
//to get user channel profile-followers, subscribers etc
router.route("/get-user-channel-profile").post(getUserChannelProfile)
export default router