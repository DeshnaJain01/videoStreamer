import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"



    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
    });
    const uploadOnCloudinary =async(localFilePath)=>{
        try {
            if(!localFilePath) return null
            //upload file on cloudinary
           const response = await cloudinary.uploader.upload
           (localFilePath,{
                resource_type:"auto"
            })
            //file has been successfully uploaded
            //console.log(`file is uploaded on cloudinary`,response.url)
           //after successful upload to cloudinary we gotta unlink it from the localpath
            fs.unlinkSync(localFilePath) // glt hai ye
            return response;
            
        } catch (error) {
            fs.unlinkSync(localFilePath) 
            // remove the locally saved temporary file as the upload operation got failed 
            return null;
        }
    }
    const deleteOnCloudinary = async(cloudinaryFilePath)=>{
        try{
            if (!cloudinaryFilePath) return null
            //delete image from cloudinary
            const response=await cloudinary.uploader.destroy(cloudinaryFilePath);
            return response;
        }catch (error){
            return null;
        }
    }
    

export {uploadOnCloudinary,deleteOnCloudinary}
   
    
   