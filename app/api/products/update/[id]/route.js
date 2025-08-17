import { v2 as cloudinary } from "cloudinary";
import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PUT(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Not Authorized!" });
    }

    const { id } = params;
    const formData = await request.formData();

    const name = formData.get("name");
    const description = formData.get("description");
    const category = formData.get("category");
    const price = formData.get("price");
    const offerPrice = formData.get("offerPrice");
    const files = formData.getAll("images");
    const existingImages = formData.getAll("existingImages");

    await connectDB();
    const product = await Product.findOne({ _id: id, userId });

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found or not authorized" });
    }

    let image = [...existingImages];

    if (files && files.length > 0 && files[0] instanceof File) {
      const result = await Promise.all(
        files.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: "auto" },
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );
            stream.end(buffer);
          });
        })
      );

      image = [...image, ...result.map((res) => res.secure_url)];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        description,
        category,
        price: Number(price),
        offerPrice: Number(offerPrice),
        image,
        date: Date.now(),
      },
      { new: true }
    );

    return NextResponse.json({ success: true, message: "Product updated successfully", updatedProduct });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}