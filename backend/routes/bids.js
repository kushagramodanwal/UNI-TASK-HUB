import express from 'express';
import {
  createBid,
  getBidsForTask,
  getMyBids,
  acceptBid,
  rejectBid,
  withdrawBid,
  updateBid,
  getBidStats
} from '../controllers/bidController.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  validateCreateBid,
  validateUpdateBid,
  validateObjectId
} from '../middleware/validation.js';

const router = express.Router();

router.get('/stats', getBidStats);
router.get('/task/:taskId', validateObjectId('taskId'), getBidsForTask);

router.use(authenticateToken);

router.post('/', validateCreateBid, createBid);
router.get('/my-bids', getMyBids);
router.put('/:bidId', validateObjectId('bidId'), validateUpdateBid, updateBid);
router.put('/:bidId/accept', validateObjectId('bidId'), acceptBid);
router.put('/:bidId/reject', validateObjectId('bidId'), rejectBid);
router.put('/:bidId/withdraw', validateObjectId('bidId'), withdrawBid);

export default router;
