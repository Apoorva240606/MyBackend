import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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
    console.log(email +username)
    if(!username && !email ){
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
History

const getCurrentUser = asyncHandler( async (req, res) => {
        return res.status(200).json(
            new ApiResponse(200, req.user, "User retrieved successfully")
        )
    })

const updateUser = asyncHandler( async (req, res) => { 
    const {fullName, email, username } = req.body;

    if(!fullName || !email || !username ) {
        throw new ApiError(400, "Anyone of fields are required")
    }
     
    const user =  await User.findByIdAndUpdate(
        req.user?._id,{
            $set:{
                fullName,email: email,username
            }
        
    },
    {new: true}
).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"))

 })

const updateAvatar = asyncHandler( async (req, res) => {
    const avatarLocalPath = req.files?.path
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if( !avatar.url ) {
        throw new ApiError(400, "Error while uploading avatar")
    
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))

})


const updateCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.files?.path
    if(!coverImageLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if( !coverImage.url ) {
        throw new ApiError(400, "Error while uploading avatar")
    
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, user, "CoverImage updated successfully"))

})


const getUserChannelProfile = asyncHandler( async (req, res) => { 

    const { username } = req.params
    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    }

    // User.find({username})
   const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }

        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                    },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                }  ,
                isSubscribed: { 
                    $cond: {
                        if: {$in: [req.user?._id,"$subscribers.subscriber"] }
                    }
                }
            }
            
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404, "Channel not found")
    
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "Channel fetched successfully")
    
    )
})
    
const getWatchHistory = asyncHandler( async (req, res) => {
    const user = await User.aggregate
    ([
        {
            $match: {
               _id: new mongoose.Types.ObjectId(req.user?._id) 
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookop:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $arrayElemAt: ["$owner", 0]
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
    .json(
        new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully")
    
    )

})



export {
        registerUser, 
        updateAvatar,
        updateUser,
        loginUser,
        changeCurrentPassword,
        getCurrentUser,
        logoutUser,
        refreshAccessToken,
        getUserChannelProfile,
        updateCoverImage,
        getWatchHistory
    }