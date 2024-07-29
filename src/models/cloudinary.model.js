import mongoose from "mongoose"
const cloudinaryAvatarSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: "User" }, // Reference to User
    avatar:{
            type :String,
            required:true
         },
    cloudinary_id:{
        type:String,
        required:true
    } ,
    cloudinary_secureUrl: {
        type:String,
        required:true
    } 
});
 const CloudinaryAvatar = mongoose.model('CloudinaryAvatar', cloudinaryAvatarSchema);
const cloudinaryCoverImageSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: "User" 
        }, // Reference to User
    coverImage:{
            type:String,
            required:true
         },
    cloudinary_id: {
        type:String,
        required:true
    } ,
    cloudinary_secureUrl: {
        type:String,
        required:true
    } 
});
const CloudinaryCoverImage= mongoose.model('CloudinaryCoverImage', cloudinaryCoverImageSchema);

export{CloudinaryAvatar,
    CloudinaryCoverImage}