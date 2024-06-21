import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";





// down here i have replaced res with _ because we are not using it and some code migth have this syntax
export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token) {
            throw new ApiError(401,"Unauthorized token")
        }
        // maybe put await in jwt
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log("decodedToken",decodedToken)
    
        const user = await User.findById(decodedToken?._id)
            .select("-password -refreshToken")
        
    
        if(!user) {
            
            throw new ApiError(401, "Invalid Authorization")
        }
    
        req.user = user;
        next()

    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access to token")
    }

})

