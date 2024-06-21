import multer from 'multer';


const storage = multer.diskStorage({
    destination: (req, file, cb,) => {
        cb(null, "./public");
        
    },
    filename: (req, file, cb) => {
        cb(null, `${file.originalname}-${Date.now()}`);
    }
    
})




export const upload = multer({storage});