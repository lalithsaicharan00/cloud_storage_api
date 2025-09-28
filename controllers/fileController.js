const cloudinary = require('../config/cloudinary');
const { File } = require('../models');
const { v4: uuidv4 } = require('uuid');


const uploadFiles = async (req, res) => {
    try {

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded.' });
        }


        const uploadPromises = req.files.map(file => {

            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { resource_type: 'auto', folder: 'cloud_storage_files' },
                    (error, result) => {
                        if (error) return reject(error);

                        result.originalname = file.originalname;
                        resolve(result);
                    }
                );
                uploadStream.end(file.buffer);
            });
        });


        const uploadResults = await Promise.all(uploadPromises);


        const filesToCreate = uploadResults.map(result => ({
            name: result.originalname,
            uuid: uuidv4(),
            url: result.secure_url,
            publicId: result.public_id,
            type: result.resource_type,
            size: result.bytes,
            userId: req.session.userId,
            parentFolderId: req.body.parentFolderId || null,
        }));


        const newFiles = await File.bulkCreate(filesToCreate);

        res.status(201).json({
            message: `${newFiles.length} files uploaded successfully!`,
            files: newFiles
        });

    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ message: 'An error occurred during file upload.' });
    }
};


const getFileById = async (req, res) => {
    try {

        const { fileId } = req.params;


        const userId = req.session.userId;


        const file = await File.findOne({
            where: {
                uuid: fileId,
                userId: userId
            }
        });


        if (!file) {
            return res.status(404).json({ message: 'File not found.' });
        }


        res.status(200).json({ file });

    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};


const downloadFile = async (req, res) => {
    try {

        const { fileId } = req.params;
        const userId = req.session.userId;


        const file = await File.findOne({
            where: {
                uuid: fileId,
                userId: userId
            }
        });


        if (!file) {
            return res.status(404).json({ message: 'File not found.' });
        }


        const response = await fetch(file.url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file from cloud storage: ${response.statusText}`);
        }


        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);


        response.body.pipe(res);

    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ message: 'An internal server error occurred during file download.' });
    }
};


const deleteFile = async (req, res) => {
    try {

        const { fileId } = req.params;
        const userId = req.session.userId;


        const file = await File.findOne({
            where: {
                uuid: fileId,
                userId: userId,
                isDeleted: false // this don't entertain the delete request twice and making api more predictable
            }
        });


        if (!file) {
            return res.status(404).json({ message: 'File not found.' });
        }


        await file.update({
            isDeleted: true,
            deletedAt: new Date()
        });


        res.status(200).json({ message: 'File moved to trash successfully.' });

    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};




module.exports = {
    uploadFiles,
    getFileById,
    downloadFile,
    deleteFile
};