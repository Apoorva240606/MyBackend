import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) => {
    try{
      const user =   await User.findById(userId)
       const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
      await  user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch(error){
        throw new ApiError(500, "Something wnet wrong while generating refresh and access token")
    }
}

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

    console.log("hereeeeeee")
    
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
        coverImage: coverImage?.url || null,
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

const loginUser = asyncHandler( async (req,res) => {
    //get user details
    // username or email
    //check that all required fields are not empty
    //check that user exists
    //check that password is correct
    // access and refresh token
    // send cookie

    const { email, username, password } = req.body;
    console.log("email",username)
    if(!username){
        throw new ApiError(400, "Email or username is required")
    }

    const user =await User.findOne({
        $or:[{email}, {username}]
    })
    console.log("user",user)
    if(!user){
        throw new ApiError(404, "User does not exist")
    }
     console.log("Hwllldfdsf")
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid password")
    }

    const {accessToken, refreshToken} =await generateAccessTokenAndRefreshToken(user._id)

   const loginUser = await User.findById(user._id).select("-password -refreshToken")
   console.log("loginUser",loginUser)

   const options = {
    httpOnly:true,
    secure: true
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(new ApiResponse(200, {
                user: loginUser, accessToken, refreshToken
                
                 
            }, "User logged in successfully"))

})

const logoutUser = asyncHandler( async (req,res) => {
  await  User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly:true,
        secure: true
       }

       return res
       .status(200)
       .clearCookie("accessToken", options)
       .clearCookie("refreshToken", options)
       .json(new ApiResponse(200, {}, "User logged out successfully"
       ))

})


const refreshAccessToken = asyncHandler( async (req,res) => {
    const incomingRefreshToken = res.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }

   try {
    const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
 
    const user = await User.findById(decodedToken._id)
 
     if(!user){
         throw new ApiError(401, "Invalid RefreshToken") 
     }
 
     if(incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, "RefreshToken has been expired or used") 
     }
 
     const options = {
         httpOnly:true,
         secure: true
        
     }
 
    const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id)
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
         new ApiResponse(200,
             {accessToken, refreshToken: newRefreshToken},
             "Access Token refreshed successfully"
         )
    )
 
   } catch (error) {
        throw new ApiError(401, "Invalid refreshToken")
   }
})

export {registerUser, loginUser, logoutUser, refreshAccessToken}