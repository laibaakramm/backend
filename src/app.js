import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({ extended: true , limit: "16kb"

}));
app.use(express.static("public"));

app.use(cookieParser());

import userRouter from "./routes/user.routes.js"; 

import subscriptionRouter from "./routes/subscription.routes.js"
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import videoRouter from "./routes/video.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/videos", videoRouter);


app.use((err, req, res, next) => {
    const status = err.statusCode || err.status || 500;
    res.status(status).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

// app.use((err, req, res, next) => {
//     const rawStatus = err && (err.statusCode ?? err.status);
//     const status = Number(rawStatus) || 500;

//     const message = (err && err.message) || String(err) || "Internal Server Error";

//     res.status(status).json({
//         success: false,
//         message,
//     });
// });

// app.use((err, req, res, next) => {
//   // Handle both Error objects and strings
//   const status =
//     (typeof err === "object" && (err.statusCode || err.status)) && Number(err.statusCode || err.status)
//       ? Number(err.statusCode || err.status)
//       : 500;

//   const message =
//     (typeof err === "object" && err.message) ||
//     (typeof err === "string" ? err : "Internal Server Error");

//   res.status(status).json({
//     success: false,
//     message,
//   });
// });


export {app};   