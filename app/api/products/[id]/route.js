import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";

export async function GET(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const { id } = await params; // Await params to resolve the promise

    await connectDB();
    const product = await Product.findOne({ _id: id, userId });

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found or not authorized" });
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error in GET /api/products/[id]:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}