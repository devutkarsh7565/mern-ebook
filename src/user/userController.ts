import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { config } from "../config/config";
import { sign } from "jsonwebtoken";
import { User } from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }

  // database call

  try {
    const user = await userModel.findOne({ email });

    if (user) {
      const error = createHttpError(400, "user already exist with this email");
      return next(error);
    }
  } catch (err) {
    return next(createHttpError(500, "Error while getting user"));
  }

  // password hash and saltRound for the security
  const hashedPassword = await bcrypt.hash(password, 10);

  let newUser: User;

  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (err) {
    return next(createHttpError(500, "Error while creating user"));
  }

  //Token Generation JWT
  try {
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    res.status(201).json({ id: newUser._id, accessToken: token });
  } catch (err) {
    return next(createHttpError(500, "Error while signing jwt token"));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }

  const user = await userModel.findOne({ email });

  if (!user) {
    return next(createHttpError(404, "user not found"));
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = createHttpError(400, "Username or password incorrect!");
    return next(error);
  }

  //create accesstoken
  try {
    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
    });

    res.status(201).json({ id: user._id, accessToken: token });
  } catch (err) {
    return next(createHttpError(500, "Error while signing jwt token"));
  }
};

export { createUser, loginUser };
