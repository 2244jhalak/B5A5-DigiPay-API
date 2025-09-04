import express from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import { createUserController } from "./user.controller";

const router = express.Router();


router.post(
  "/create",
  authenticate,           // User must be logged in
  authorize(["admin"]),    // Only admin can create users
  createUserController
);



export default router;
