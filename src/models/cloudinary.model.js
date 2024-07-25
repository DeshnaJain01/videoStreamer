import mongoose from "mongoose"
const cloudinaryAvatarSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: "User" }, // Reference to User
    cloudinary_id:{
        type:String
    } ,
    cloudinary_secureUrl: {
        type:String
    } 
});
 const CloudinaryAvatar = mongoose.model('CloudinaryAvatar', cloudinaryAvatarSchema);
const cloudinaryCoverImageSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: "User" }, // Reference to User
    cloudinary_id: {
        type:String
    } ,
    cloudinary_secureUrl: {
        type:String
    } 
});
const CloudinaryCoverImage= mongoose.model('CloudinaryCoverImage', cloudinaryCoverImageSchema);

export{CloudinaryAvatar,
    CloudinaryCoverImage}