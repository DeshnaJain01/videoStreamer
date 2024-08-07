import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
const videoSchema=new mongoose.Schema(
    {
        videoFile:{
            type:String, // cloudinary URL
            required:true
        },
        thumbnail:{
            type:String, // cloudinary URL
            required:true  
        },
        title:{
            type:String,
            required:true  
        },
        description:{
            type:String,
            required:true  
        },
        duration:{
            type:Number, // from cloudinary
            required:true  
        },
        views:{
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true

        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {
        timestamps:true
    }
)
videoSchema.plugin(mongooseAggregatePaginate)
const Video = mongoose.model("Video",videoSchema);

const cloudinaryVideoSchema=new mongoose.Schema(
    {
        videoId: { 
            type: mongoose.Schema.Types.ObjectId,
             ref: "Video" },
        videoUrl:{
            type:String,
            required:true
        },
        cloudinaryPublicId:{
            type:String,
            required:true
        },
        cloudinarySecureUrl:{
            type:String,
            required:true
        },
        duration:{
            type:Number, // from cloudinary
            required:true
        }
    },
    {
        timestamps:true
    });
const CloudinaryVideo=new mongoose.model("CloudinaryVideo",cloudinaryVideoSchema);
export{Video, CloudinaryVideo}