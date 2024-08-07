import { Router } from "express";
import { deleteVideo, 
        getAllVideos,
        getVideoById,
        publishAVideo,
        togglePublishStatus,
        updateVideo } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router=Router()
//apply verifyJWT middleware to all routes in this file
router.use(verifyJWT)
router.route("/")
      .get(getAllVideos)
      .post(upload.fields([
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
      ]),
      publishAVideo
    ) 
router.route("/:owner")
      .get(getVideoById)
      .delete(deleteVideo)
      .patch(upload.single("thumbnail"),updateVideo)
router.route("/toggle/publish/:userId").patch(togglePublishStatus)
export default router  