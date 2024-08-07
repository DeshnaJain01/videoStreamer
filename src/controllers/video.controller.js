
import {Video, CloudinaryVideo} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy='created_at', sortType='desc', userId } = req.query
    //TODO: get all videos based on query, sort, pagination
   
        // Build the query object
            let searchQuery = {};
            if (query) {
                searchQuery = {
                    $text: { $search: query }
                };
            }
            if (userId) {
                searchQuery.owner = userId;
                console.log(userId)
            }
          // Calculate the skip value for pagination
          const skip = (page - 1) * limit;
    const allVideos= await Video
                           .find(searchQuery)
                          // .orderBy(orderByColumn,orderByDirection)
                           .limit(parseInt(limit))
                           .skip(skip)
                           .sort({ [sortBy]: sortType === 'desc' ? -1 : 1 })
    console.log(allVideos);
                          
    
     // Get the total count for pagination
     const totalVideos = await Video.countDocuments(searchQuery);
    console.log(totalVideos)
    
    if(!allVideos || allVideos.length === 0){
        console.log('could not get all videos from db')
              return res.status(404).json(new ApiError(404,"videos not found"))
                 }
     const response={

        status: 200,
        data: allVideos.map(video => ({
            _id: video._id,
            title: video.title,
            description: video.description,
            createdAt: video.createdAt,
            onwer: video.owner,
            videoFile: video.videoFile, // Include the video URL
            })),
        message: "All videos retrieved successfully",
        pagination: {
            total: totalVideos,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(totalVideos / limit)

    }}
return res.status(200)
          .json(new ApiResponse( 200, response,
             "All videos retrieved successfully"
            ))                        
})

const publishAVideo = asyncHandler(async (req, res) => {
    //get the content
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
   //get the video
    const videoLocalPath = req.files?.videoFile[0]?.path;
    if(!videoLocalPath){
        console.log("video not found")
       return res.status(404).json(new ApiError(404,"Video is required"))
    }

    //upload the video
const video = await uploadOnCloudinary(videoLocalPath)
if(!video){
    console.log("video not upload")
    return res.status(404).json(new ApiError(404,"Video is required",errors))
} 
const creatAVideo=await Video.create({
    videoFile:video.url,
    thumbnail:video.public_id,
    title,
    description,
    duration:video.duration,
    isPublished:true,
    owner:req.user._id

})
if(!creatAVideo){
    console.log("video not created")
    return res.status(500).json(new ApiError(500,"something went wrong while pushing the video to db"))
}
const cloudinaryVideo=await CloudinaryVideo.create({
    videoId:creatAVideo._id,
    videoUrl:video.url,
    cloudinaryPublicId: video.public_id,
    cloudinarySecureUrl:video.secure_url,
    duration:video.duration
})

if(!cloudinaryVideo){
    return res.status(500).json(500,"Something went wrong while storing data of cloudinary to db")
}
const createdVideo= await Video.findById(creatAVideo._id)

return res.status(200).json(new ApiResponse(200,{createdVideo,cloudinaryVideo},"Video updated successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { userId } = req.params
    console.log(userId);
   const getVideo = await Video.findById(userId)
    console.log(getVideo)    
if(!getVideo||!getVideo.length===0){
        console.log("again db retrival issue")
        return res.status(500).json(new ApiError(500,"something went wrong while getting the data "))

    }
    const response = {
        data: {
            _id: getVideo._id,
            title: getVideo.title,
            description: getVideo.description,
            createdAt: getVideo.createdAt,
            owner: getVideo.owner,
            videoFile: getVideo.videoFile, // Include the video URL
            thumbnail: getVideo.thumbnail,
            views: getVideo.views,
            isPublished: getVideo.isPublished,
            duration: getVideo.duration,
            updatedAt: getVideo.updatedAt
        }
        
    }
return res.status(200).json(new ApiResponse(200,response,"Succesfully retrived the video"))


    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId,} = req.params
    const{title,description }=req.body
    console.log(videoId)
    console.log(title);
    console.log(description);
    const updateAVideo=await Video.findByIdAndUpdate(videoId,
        {
            $set:{ 
                title,
                description

            }
        },
            {new:true}
       )
       console.log(updateAVideo)
       if(!updateAVideo){
        return res.status(500).json(new ApiError(500,"db retrival error"))
       }
    
       return res.status(200).json(new ApiResponse(200,updateAVideo,"updated a video successfully"))
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video=await Video.findById(videoId)
    const deletedVideo= await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        return res.status(500).json(new ApiError(500,"Error while deleting the video from db"))
    }
    const videoUrl=video.videoFile
    await deleteOnCloudinary(videoUrl)
    return res.status(200).json(new ApiResponse(200, video, "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video=await Video.findById(videoId)
    if(!video){
        return res.status(500).json(500,"db toggle issue")
    }
    //toggle the publish status
    video.isPublished=!video.isPublished
    //save the updated video
    const updatedVideo=await video.save()
    return res.status(200).json(new ApiResponse(200, updatedVideo, "Successfully toggled publish status"));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}