import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";

/*
  Rejects malformed :id params with a clean 400 instead of letting an invalid id
  reach Mongoose and throw a CastError (which would surface as a 500 and leak
  internals). Also short-circuits pointless DB lookups.
*/
export function validateObjectId(param = "id") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!Types.ObjectId.isValid(req.params[param])) {
      return res.status(400).json({ message: "Invalid id" });
    }
    next();
  };
}
