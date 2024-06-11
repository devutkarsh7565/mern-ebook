import { NextFunction, Request, Response } from "express";
import { cloudinary } from "../config/cloudinary";
import path from "node:path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "node:fs";

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

    const newBook = await bookModel.create({
      title,
      genre,
      author: "66682917bd4849df2f89dabd",
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

export { createBook };
