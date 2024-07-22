import {Router} from "express"
import { loginUser, logOutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js"
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

export default router