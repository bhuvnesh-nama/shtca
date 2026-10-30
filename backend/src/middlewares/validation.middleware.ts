import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import ApiResponse from "../utils/ApiResponse";

export const validate =
  (schema: ZodTypeAny, property: "body" | "query" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req[property]);
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const formattedErrors = err.issues.map((issue) => ({
          path: issue.path.join(".") || "unknown",
          message: issue.message,
          code: issue.code,
        }));

        const errorResponse = {
          success: false,
          statusCode: 400,
          message: "Validation failed",
          errors: formattedErrors,
          count: formattedErrors.length,
        };

        return res
          .status(400)
          .json(new ApiResponse(400, "Validation failed", errorResponse));
      }

      next(err);
    }
  };
