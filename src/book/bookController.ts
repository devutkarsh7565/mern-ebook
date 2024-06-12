import { NextFunction, Request, Response } from "express";
import { cloudinary } from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";
import { AuthRequest } from "../middlewares/authenticate";

const createBook = async (req: Request, res: Response, next: NextFunction) => {
  console.log("files", req.files);

  const { title, genre } = req.body;

  // 'image/png'
  // we have to only select png

  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
    const fileName = files.coverImage[0].filename;
    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      fileName
    );

    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-covers",
      format: coverImageMimeType,
    });

    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );

    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdfs",
        format: "pdf",
      }
    );

    console.log("upload result", uploadResult, bookFileUploadResult);

    const _req = req as AuthRequest;

    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    // delete temp files from public folder
    try {
      await fs.promises.unlink(filePath);
      await fs.promises.unlink(bookFilePath);
    } catch (err) {
      console.log(err);
      return next(
        createHttpError(
          500,
          "error while deleting temp files from public folder"
        )
      );
    }
    res
      .status(201)
      .json({ message: "ebook created sucessfully", id: newBook._id });
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "error while uploading the files"));
  }
};

const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  console.log("files", req.files);

  const { title, genre } = req.body;

  const bookId = req.params.bookId;

  const book = await bookModel.findOne({
    _id: bookId,
  });

  if (!book) {
    return next(createHttpError(404, "Book not found"));
  }

  // check access to ensure that the book which author want to update has its own book

  const _req = req as AuthRequest;
  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, "you can not update others book"));
  }

  // 'image/png'
  // we have to only select png

  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    let completeCoverImage = "";
    let coverImageFilePath = "";

    if (files.coverImage) {
      const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
      const fileName = files.coverImage[0].filename;
      const filePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        fileName
      );

      const uploadResult = await cloudinary.uploader.upload(filePath, {
        filename_override: fileName,
        folder: "book-covers",
        format: coverImageMimeType,
      });

      completeCoverImage = uploadResult.secure_url;
      coverImageFilePath = filePath;
    }

    let completeFile = "";
    let pdfFilePath = "";

    if (files.file) {
      const bookFileName = files.file[0].filename;
      const bookFilePath = path.resolve(
        __dirname,
        "../../public/data/uploads",
        bookFileName
      );

      const bookFileUploadResult = await cloudinary.uploader.upload(
        bookFilePath,
        {
          resource_type: "raw",
          filename_override: bookFileName,
          folder: "book-pdfs",
          format: "pdf",
        }
      );

      completeFile = bookFileUploadResult.secure_url;
      pdfFilePath = bookFilePath;
    }

    console.log("upload result", completeCoverImage, completeFile);

    const _req = req as AuthRequest;

    const updateBook = await bookModel.findOneAndUpdate(
      { _id: bookId },
      {
        title,
        genre,
        author: _req.userId,
        coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
        file: completeFile ? completeFile : book.file,
      },
      { new: true }
    );

    // delete temp files from public folder
    try {
      await fs.promises.unlink(coverImageFilePath);
      await fs.promises.unlink(pdfFilePath);
    } catch (err) {
      console.log(err);
      return next(
        createHttpError(
          500,
          "error while deleting temp files from public folder"
        )
      );
    }
    res.status(201).json({
      message: "ebook created sucessfully",
      updateBook: updateBook && updateBook,
    });
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "error while uploading the files"));
  }
};

const getAllBooks = async (req: Request, res: Response, next: NextFunction) => {
  //add pagination with package mongoose pagination => try it
  try {
    const book = await bookModel.find();
    res.json({ book });
  } catch (err) {
    return next(createHttpError(500, "error while getting books"));
  }
};

const getSingleBooks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { bookId } = req.params;
  //add pagination with package mongoose pagination => try it
  try {
    const singleBook = await bookModel.findOne({ _id: bookId });
    res.json({ singleBook });
  } catch (err) {
    return next(createHttpError(500, "error while getting a books"));
  }
};

export { createBook, updateBook, getAllBooks, getSingleBooks };
