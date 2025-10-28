import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if(!videoId) {
        return res.status(400).json({message: "Video ID is required"});
    }

      const comments = await Comment.find({ video: videoId })
        .populate("user", "username avatar") 
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);
        
    const totalComments = await Comment.countDocuments({ video: videoId });

    res.status(200).json({
        success: true,
        page: pageNumber,
        totalPages: Math.ceil(totalComments / limitNumber),
        totalComments,
        comments,
    });
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {text} = req.body
    const userId = req.user?._id

    if(!videoId) {
        return res.status(400).json({message: "Video ID is required"});
    }

    if (!text || text.trim().length === 0) {
        return res.status(400).json({ success: false, message: "Comment text cannot be empty." });
    }

    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json({ success: false, message: "Video not found." });
    }
    
    const newComment = await Comment.create({
        video: videoId,
        user: userId,
        text: text.trim(),
    })

    const populatedComment = await newComment.populate("user", "username avatar").execPopulate();

    res.status(201).json({
        success: true,
        message: "Comment added successfully",
        comment: populatedComment,
    });
})
 
const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const { id } = req.params;
    const { text } = req.body;

   if (!text || text.trim() === '') {
        res.status(400);
        throw new Error('Comment text cannot be empty');
    }

    const comment = await Comment.findById(id);
    if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
    }

    if (comment.user.toString() !== req.user.id && !req.user.isAdmin) {
        res.status(403);
        throw new Error('Not authorized to update this comment');
    }
  
    comment.text = text;
    const updatedComment = await comment.save();

    res.status(200).json(updatedComment);
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
    }

    if (comment.user.toString() !== req.user.id && !req.user.isAdmin) {
        res.status(403);
        throw new Error('Not authorized to delete this comment');
    }

    await comment.deleteOne();

    res.status(200).json({
         message: 'Comment deleted successfully'
     });
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }