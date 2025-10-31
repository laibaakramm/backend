import { Comment } from "../models/comment.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (!videoId) {
        return res.status(400).json({ message: "Video ID is required" });
    }

    const comments = await Comment.find({ video: videoId })
        .populate("owner", "username avatar")
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
    const { videoId } = req.params;
    const message = req.body.text ?? req.body.message ?? req.body.content;
    const userId = req.user?._id;

    if (!videoId) {
        return res.status(400).json({ success: false, message: "Video ID is required" });
    }
    if (!message || message.toString().trim().length === 0) {
        return res.status(400).json({ success: false, message: "Comment text cannot be empty." });
    }

    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json({ success: false, message: "Video not found." });
    }

    const newComment = await Comment.create({
        video: videoId,
        owner: userId,
        content: message.toString().trim(),
    });

    try {
        await Video.findByIdAndUpdate(videoId, { $push: { comments: newComment._id } });
    } catch (e) {
        console.error("Failed to update video's comments array:", e);
    }

    const populatedComment = await Comment.findById(newComment._id).populate("owner", "username avatar");

    res.status(201).json({
        success: true,
        message: "Comment added successfully",
        comment: populatedComment,
    });
});


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
    const commentId = req.params.commentId ?? req.params.id;

    if (!commentId) {
        res.status(400);
        throw new Error('Comment ID is required');
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
    }
    const commentOwnerId = comment.owner?.toString();
    const requestUserId = (req.user?._id ?? req.user?.id)?.toString();
    if (commentOwnerId !== requestUserId && !req.user?.isAdmin) {
        res.status(403);
        throw new Error('Not authorized to delete this comment');
    }
    await comment.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Comment deleted successfully'
    });
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}