import mongoose from "mongoose";
import { type } from "os";
import { ref } from "process";
const fileSchema = new mongoose.Schema({
    filename:{
        type:String,
        required:true,
},

UserId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
},

fileType:{
    type:String,
    required:true
},
key:{


    type:String,

    required:true,
},
 uploadedAt: {
    type: Date,
    default: Date.now,
  },

}   

)

export default mongoose.model("File",fileSchema);