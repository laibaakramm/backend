import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const subscribedId = req.user.id;

    if(channelId === subscribedId) {
       res.status(400)
       throw new Error("You cannot subscribe to your own channel");
    }

    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: subscribedId,
    })

    if(existingSubscription) {
        await existingSubscription.deleteOne();
        return res.status(200).json({
            message: "Unsubscribed successfully",
            subscribed: false,
        });
    } else {
        const newSubscription = await Subscription.create({
            channel: channelId,
            subscriber: subscribedId,
        })
        return res.status(200).json({
            message: "Subscribed successfully",
            subscribed: true,
            subscription: newSubscription,
        });
    }
})


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const subscriptions = await Subscription.find({channel: channelId})
    .populate("subscriber", "username name avatar")
    .lean();

    if(!subscriptions.length) {
        return res.status(200).json({
            message: "No subscribers found",
            subscribers: [],
            count : 0
        });
    }
    const subscribers = subscriptions.map(sub => sub.subscriber);
    res.status(200).json({
        message: "Subscribers fetched successfully",
        subscribers,
        count: subscribers.length
    })

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const subscriptions = await Subscription.find({ subscriber: subscriberId })
    .populate('channel', 'username name avatar') 
    .lean()

    if (!subscriptions.length) {
        return res.status(200).json({
            message: "No subscribed channels found",
            channels: [],
            count: 0
        })
    }

    const channels = subscriptions.map(sub => sub.channel)

    res.status(200).json({
        message: "Subscribed channels fetched successfully",
        channels,
        count: channels.length
    })
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}