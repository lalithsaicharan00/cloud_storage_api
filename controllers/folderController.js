const { Folder } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Sequelize } = require('sequelize');


const createFolder = async (req, res) => {
    try {

        const { name, parentFolderId } = req.body;

        const userId = req.session.userId;


        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Folder name is required.' });
        }


        const newFolder = await Folder.create({
            name: name.trim(),
            uuid: uuidv4(),
            userId: userId,
            parentFolderId: parentFolderId || null
        });


        res.status(201).json(newFolder);

    } catch (error) {



        if (error instanceof Sequelize.UniqueConstraintError) {

            return res.status(409).json({ message: 'A folder with this name already exists in this location.' });
        }

        console.error('Error creating folder:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};


const getFolderById = async (req, res) => {
    try {

        const { folderId } = req.params;

        const userId = req.session.userId;


        const folder = await Folder.findOne({
            where: {
                uuid: folderId,
                userId: userId,
                isDeleted: false
            },

            include: [
                {
                    model: Folder,
                    as: 'SubFolders',
                    where: { isDeleted: false },
                    required: false
                },
                {
                    model: File,
                    where: { isDeleted: false },
                    required: false
                }
            ]
        });

        if (!folder) {
            return res.status(404).json({ message: 'Folder not found.' });
        }

        res.status(200).json(folder);

    } catch (error) {
        console.error('Error fetching folder:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};


const softDeleteContents = async (folderId, userId, transaction) => {

    await File.update(
        { isDeleted: true, deletedAt: new Date() },
        { where: { parentFolderId: folderId, userId: userId }, transaction }
    );


    const subFolders = await Folder.findAll({
        where: { parentFolderId: folderId, userId: userId },
        transaction
    });


    for (const subFolder of subFolders) {
        await softDeleteContents(subFolder.folderId, userId, transaction);
    }

    await Folder.update(
        { isDeleted: true, deletedAt: new Date() },
        { where: { folderId: folderId, userId: userId }, transaction }
    );
};



const deleteFolder = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { folderId: folderUuid } = req.params;
        const userId = req.session.userId;

        const folder = await Folder.findOne({
            where: { uuid: folderUuid, userId: userId, isDeleted: false },
            transaction: t
        });

        if (!folder) {
            await t.rollback();
            return res.status(404).json({ message: 'Folder not found.' });
        }


        await softDeleteContents(folder.folderId, userId, t);

        await t.commit();

        res.status(200).json({ message: 'Folder and all its contents have been moved to trash.' });

    } catch (error) {
        await t.rollback();
        console.error('Error deleting folder:', error);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
};


module.exports = {
    createFolder,
    getFolderById,
    deleteFolder
};