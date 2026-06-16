import Router from 'express'
import {authMiddleware} from '../middlewares/auth.middleware.js'
import { createCoversation, getCoversations, sendMessage , getMessages} from '../controllers/message.controller.js'

const router = Router()

router.post('/create-conversation', authMiddleware, createCoversation)
router.get('/get-conversations', authMiddleware, getCoversations)
router.post('/send-message/:conversationId', authMiddleware, sendMessage)   
router.get('/get-message/:conversationId', authMiddleware, getMessages)   

export default router