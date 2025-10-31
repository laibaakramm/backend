import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        // console.log(token);
        if (!token) {
            throw new ApiError("Unauthorized request", 401)
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            
            throw new ApiError("Invalid Access Token", 401)
        }
    
        req.user = user;
        next()
    } catch (error) {
        //throw new ApiError(401, error?.message || "Invalid access token")

         const err = error instanceof ApiError ? error : new ApiError(401, error?.message || "Invalid access token");
        err.statusCode = Number(err.statusCode) || 401;
        // if using asyncHandler you can throw, but forwarding keeps the shape consistent
        throw err;
    }
    
})