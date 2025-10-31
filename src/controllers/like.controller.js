import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    const userId = req.user._id;

    const video = await Video.findOne({videoId});
    if (!video) {
        res.status(404);
        throw new Error('Video not found');
    }

    const existingLike = await Like.findOne({ likedBy: userId, video: videoId });
    if (existingLike) {
        await existingLike.deleteOne();
        await Video.findByIdAndUpdate(videoId, { $inc: { likeCount: -1 } });

        return res.status(200).json({
            success: true,
            message: 'Liked removed'
        });
    }
    else {
        await Like.create({ video: videoId, likedBy: userId });
        await Video.findByIdAndUpdate(videoId, { $inc: { likeCount: 1 } });

        return res.status(200).json({
            success: true,
            message: 'Video liked'
        });
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
    }

    const existingLike = await Like.findOne({ likedBy: userId, comment: commentId });

    if (existingLike) {
        await existingLike.deleteOne();
        await Comment.findByIdAndUpdate(commentId, { $inc: { likeCount: -1 } });

        return res.status(200).json({
            success: true,
            message: 'Like removed from comment'
        });
    } else {
        await Like.create({ comment: commentId, likedBy: userId });
        await Comment.findByIdAndUpdate(commentId, { $inc: { likeCount: 1 } });

        return res.status(200).json({
            success: true,
            message: 'Comment liked'
        });
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId = req.user._id;

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        res.status(404);
        throw new Error('Tweet not found');
    }

    const existingLike = await Like.findOne({ likedBy: userId, tweet: tweetId });

    if (existingLike) {
        await existingLike.deleteOne();
        await Tweet.findByIdAndUpdate(tweetId, { $inc: { likeCount: -1 } });

        return res.status(200).json({
            success: true,
            message: 'Like removed from tweet'
        });
    } else {
        await Like.create({ tweet: tweetId, likedBy: userId });
        await Tweet.findByIdAndUpdate(tweetId, { $inc: { likeCount: 1 } });

        return res.status(200).json({
            success: true,
            message: 'Tweet liked'
        });
}
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id;

    const likedVideos = await Like.find({ likedBy: userId, video: { $exists: true } })
    .populate({
        path: 'video',
        populate: { path: 'uploadedBy', select: 'username' },
        select: 'title description uploadedBy',
    });

    const videos = likedVideos.map(like => like.video).filter(video => video !== null);

    return res.status(200).json({
        success: true,
        videos,
        count: videos.length
    });
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}