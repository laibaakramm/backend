import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

// const createVideo = asyncHandler(async (req, res) => {
//   const { title, description, url, thumbnail } = req.body;

//   // Optionally get user ID from JWT middleware
//   const userId = req.user?._id;

//   if (!title || !url) {
//     return res.status(400).json({ success: false, message: "Title and URL are required." });
//   }

//   const video = await Video.create({
//     title,
//     description,
//     url,
//     thumbnail,
//     user: userId
//   });

//   res.status(201).json({
//     success: true,
//     message: "Video uploaded successfully",
//     data: video
//   });
// });


const createVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user?._id;

  // Validate required fields
  if (!title || !description) {
    return res.status(400).json({ success: false, message: "Title and description are required." });
  }
  if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
    return res.status(400).json({ success: false, message: "Video file and thumbnail are required." });
  }

  // Upload video file to Cloudinary
//   const videoUpload = await uploadOnCloudinary(req.files.videoFile[0].path);
//   if (!videoUpload?.secure_url) {
//     return res.status(500).json({ success: false, message: "Video upload failed." });
//   }

  const videoFilePath = req.files.videoFile[0].path;     // local path or URL after upload
  const thumbnailPath = req.files.thumbnail[0].path;     // local path or URL after upload


    const videoUrl = videoFilePath;
  const thumbnailUrl = thumbnailPath;
  const duration = 0; // Placeholder for duration, replace with actual logic if needed
  // Upload thumbnail if provided
  //let thumbnailUrl = "";
//   if (req.files.thumbnail && req.files.thumbnail.length > 0) {
//     const thumbnailUpload = await uploadOnCloudinary(req.files.thumbnail[0].path, "thumbnails");
//     thumbnailUrl = thumbnailUpload?.secure_url || "";
//   }

  // Create video document in DB with URLs from Cloudinary
  const video = await Video.create({
    title,
    description,
    videoFile: videoUrl,
    duration,
    thumbnail: thumbnailUrl,
    user: userId
  });

  res.status(201).json({
    success: true,
    message: "Video uploaded successfully",
    data: video
  });
});


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy="createdAt", sortType="desc"  , userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const filter ={}

    if(userId) {
        filter.user = userId;
    }
    if(query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
        ];
    }

    const sortOptions = {
        [sortBy]: sortType ==="asc" ? 1: -1,
    };

    const totalVideos = await Video.countDocuments(filter);

    const videos = await Video.find(filter).sort(sortOptions)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .populate("user", "username avatar")
        .lean();

    res.status(200).json({
        success: true,
        totalVideos,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalVideos / limitNumber),
        videos,
    });    
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title || !description) {
        return res.status(400).json({ success: false, message: "Title and description are required." });
    }

    if(!req.files || !req.files.video) {
        return res.status(400).json({ success: false, message: "Video file is required." });
    }

    const videoLocalPath = req.files.video[0].path;

    const videoUpload = await uploadOnCloudinary(videoLocalPath);
    if(!videoUpload?.secure_url) {
        return res.status(500).json({ success: false, message: "Video upload failed." });
    }

    const newVideo = await Video.create({
        title,
        description,
        videoUrl: videoUpload.secure_url,
        duration: videoUpload.duration || 0,
        user: req.user._id,

    });

    res.status(201).json({ 
        success: true, 
        message: "Video published successfully.", 
        video: newVideo,
     });
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!videoId) {
        return res.status(400).json({
            success: false,
            message: "Video ID is required."
        });
    }

    const video = await Video.findById(videoId)
        .populate("user", "username avatar")
        .lean();

    if(!video) {
        return res.status(404).json({
            success: false,
            message: "Video not found."
        });
    }

    await Video.findByIdAndUpdate(videoId, {$inc: {views: 1}});

    res.status(200).json({
        success: true,
        message: "Video fetched successfully.",
        video,
    });
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;
    
    if(!videoId) {
        return res.status(400).json({
            success: false,
            message: "Video ID is required."
        });
    }

    const video = await Video.findById(videoId);

    if(!video) {
        return res.status(404).json({
            success: false,
            message: "Video not found."
        });
    }

    if(video.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized to update this video."
        });
    }

    let newThumbnailUrl = video.thumbnailUrl;
    if(req.file) {
        const thumbnailLocalPath = req.file.path;
        const uploadResult = await uploadOnCloudinary(thumbnailLocalPath, "thumbnails");

        if(uploadResult?.secure_url) {
            newThumbnailUrl = uploadResult.secure_url;
        }
    }


    video.title = title || video.title;
    video.description = description || video.description;
    video.thumbnailUrl = newThumbnailUrl;

    const updatedVideo = await video.save();

    res.status(200).json({
        success: true,
        message: "Video updated successfully.",
        video: updatedVideo,
    });
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    const video = await Video.findById(videoId);
    if(!video) {
        res.status(404)
        throw new Error("Video not found")
    }

    if(video.user.toString() !== req.user.id) {
        res.status(403)
        throw new Error("You are not authorized to delete this video")
    }

    await video.deleteOne();

    res.status(200).json({
        message: "Video deleted successfully"
    })
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId);
    if(!video) {
        res.status(404)
        throw new Error("Video not found")
    }

    if(video.user.toString() !== req.user.id) {
        res.status(403)
        throw new Error("You are not authorized to change publish status of this video")
    }

    video.isPublished = !video.isPublished;
    await video.save();

    res.status(200).json({
        message: `Video has been ${video.isPublished ? "published" : "unpublished"} successfully.`,
        video,
    })
})

export {
    createVideo,
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}