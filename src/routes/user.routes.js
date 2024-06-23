import {Router} from 'express';
import {    changeCurrentPassword,
            getCurrentUser,
            getUserChannelProfile, 
            getWatchHistory, 
            loginUser, 
            logoutUser, 
            refreshAccessToken, 
            registerUser, 
            updateAvatar, 
            updateCoverImage, 
            updateUser }
             from '../controllers/user.controller.js';
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),  
    registerUser
)

router.route("/login").post( loginUser )

//secured routes
router.route("/logout").post(  verifyJWT, logoutUser )

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-profile").patch(verifyJWT,updateUser)

router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar)

router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage)

router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)

export default router;