import {getAuth} from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import Address from "@/models/address";
import {NextResponse} from "next/server";


export async function GET(request){
    try {
        const {userId} = getAuth(request)

        await connectDB()
        const addresses = await Address.find({userId})
        return NextResponse.json({success:true, addresses})
    }catch (e) {
        return NextResponse.json({success:false, message: e.message})
    }
}