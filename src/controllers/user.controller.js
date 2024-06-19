import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler( async (req,res) => {
    // get user details from frontend
    // validataion - not empty
    // check if user already exists: username , eamil
    // check for images, check for avatar
    // create user object - create token field from response
    // remove passsword and refresh token field from from response
    // check for user creation
    // return res

    const  {fullName, email, username, password } = req.body;
    console.log("email: ", email);
    
    if( 
        [fullName, email, username , password].some((field) => 
            field?.trim() === ""
        )
    ){
        throw new ApiError(400, "All fields are required")
    }


   const existUser = await  User.findOne({$or: 
        [{ email }, { username }]
    })
    
    if(existUser){
        throw new ApiError(409, "User already exists")
    }

   const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }
    if(!coverImageLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

  const avatar =  await uploadOnCloudinary(avatarLocalPath);
  const coverImage =   await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }
    if(!coverImage){
        throw new ApiError(400, "Avatar file is required")
    }

  const user = await  User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url,
        email,
        username: username.toLowerCase(),
        password,

    })

    const userCreated = await User.findById(user.id).select(
        "-password -refreshToken",
    )

    if(!userCreated){
        throw new ApiError(500, "User not created")
    }

    return res.status(201).json(
        new ApiResponse(200, userCreated, "User created successfully")
    )

})



export {registerUser}