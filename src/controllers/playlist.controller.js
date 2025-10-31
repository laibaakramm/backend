import {Playlist} from "../models/playlist.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist

    if (!name) {
        res.status(400);
        throw new Error("Playlist name is required");
    }

    const playlist = await Playlist.create({
        name,
        description: description || "",
        createdBy: req.user._id,
        songs: [],
    });

    res.status(201).json({
        success: true,
        playlist,
    });
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!userId) {
        res.status(400);
        throw new Error("User ID is required");
    }

    const playlists = await Playlist.find({user: userId}).populate('songs');

    if(!playlists || playlists.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No playlists found"
        });
    }

    res.status(200).json({
        success: true,
        count: playlists.length,
        playlists,
    });

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        res.status(400);
        throw new Error("Playlist ID is required");
    }

    const playlist = await Playlist.findById(playlistId).populate("user", "name email")
    .populate("songs");

    if(!playlist) {
        return res.status(404).json({
            success: false,
            message: "Playlist not found"
        });
    }

    res.status(200).json({
        success: true,
        playlist
    });
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId) {
        res.status(400);
        throw new Error("Playlist ID and Video ID are required");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist) {
        res.status(404);
        throw new Error("Playlist not found");
    }

    if(playlist.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("You are not authorized to modify this playlist");
    }

     const alreadyExists = playlist.videos?.some(
    (v) => v.toString() === videoId.toString()
    );

    if (alreadyExists) {
    res.status(400);
    throw new Error("Video already exists in the playlist");
    }

     playlist.videos.push(videoId);
     await playlist.save();

     const updatedPlaylist = await Playlist.findById(playlistId).populate("videos")
     .populate("user", "name email");

     res.status(200).json({
        success: true,
        playlist: updatedPlaylist,
        message: "video added to playlist"
     });
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!playlistId || !videoId) {
        res.status(400);
        throw new Error("Playlist ID and Video ID are required");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) {
        res.status(404);
        throw new Error("Playlist not found");
    }

    if(playlist.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("You are not authorized to modify this playlist");
    }

    const videoIndex = playlist.videos.findIndex(
    (v) => v.toString() === videoId.toString()
    );

    if (videoIndex === -1) {
    res.status(400);
    throw new Error("Video not found in the playlist");
    }

    playlist.videos.splice(videoIndex, 1);
    await playlist.save();

    const updatedPlaylist = await Playlist.findById(playlistId)
    .populate("videos").populate("user", "name email");

    res.status(200).json({
        success: true,
        playlist: updatedPlaylist,
        message: "video removed from playlist"
    });
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!playlistId) {
        res.status(400);
        throw new Error("Playlist ID is required");
    }
    const playlist = await Playlist.findById(playlistId);

    if(!playlist) {
        res.status(404);
        throw new Error("Playlist not found");
    }

    if(playlist.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("You are not authorized to delete this playlist");
    }
    await playlist.remove();
    res.status(200).json({
        success: true,
        message: "Playlist deleted successfully"
    });
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!playlistId) {
        res.status(400);
        throw new Error("Playlist ID is required");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist) {
        res.status(404);
        throw new Error("Playlist not found");
    }

    if(playlist.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("You are not authorized to update this playlist");
    }

    if(name) playlist.name = name;
    if(description) playlist.description = description;

    const updatedPlaylist = await playlist.save();

    res.status(200).json({
        success: true,
        playlist: updatedPlaylist,
        message: "Playlist updated successfully"
    });
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}