import {getAuth} from "@clerk/nextjs/server";
import connectDB from "@/config/db";
import {create} from "axios";
import Address from "@/models/Address";
import {NextResponse} from "next/server";


export async function POST(request){

    try {
        const {userId} = getAuth(request)
        const {address} = await request.json()

        await connectDB()
        const newAddress = await Address.create({...address,userId})

        return NextResponse.json({success: true, message: 'Address added successfully'})
    } catch (e) {
        return NextResponse.json({success: false, message: e.message})
    }
}