const multer = require('multer');

const storage = multer.memoryStorage();

const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
];

const upload = multer({
    storage,

    limits: {
        fileSize: 2 * 1024 * 1024
    },

    fileFilter: (req, file, callback) => {

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return callback(
                new Error('Only JPG, PNG and WebP images are allowed.')
            );
        }

        callback(null, true);

    }
});

const uploadTeacherImage = (req, res, next) => {

    upload.single('profileImage')(req, res, (error) => {

        if (error instanceof multer.MulterError) {

            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'Image size must not exceed 2 MB.'
                });
            }

            return res.status(400).json({
                success: false,
                message: error.message
            });

        }

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        next();

    });

};

module.exports = {
    uploadTeacherImage
};