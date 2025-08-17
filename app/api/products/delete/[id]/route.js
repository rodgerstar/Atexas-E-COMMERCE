import { getAuth } from "@clerk/nextjs/server";
import authSeller from "@/lib/authSeller";
import { NextResponse } from "next/server";
import connectDB from "@/config/db";
import Product from "@/models/Product";

export async function DELETE(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Not Authorized!" });
    }

    const { id } = params;

    await connectDB();
    const product = await Product.findOne({ _id: id, userId });

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found or not authorized" });
    }

    await Product.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message });
  }
}