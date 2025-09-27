const sequelize = require('../config/database');

// Import your models
const User = require('./user');
const Folder = require('./folder');
const File = require('./file');

//-- DEFINE RELATIONSHIPS --//

// User <--> Folder Relationship
User.hasMany(Folder, { foreignKey: 'user_id' });
Folder.belongsTo(User, { foreignKey: 'user_id' });

// Folder <--> Folder Self-Referencing Relationship
Folder.hasMany(Folder, { as: 'SubFolders', foreignKey: 'parent_folder_id' });
Folder.belongsTo(Folder, { as: 'ParentFolder', foreignKey: 'parent_folder_id' });

// User <--> File Relationship
User.hasMany(File, { foreignKey: 'user_id' });
File.belongsTo(User, { foreignKey: 'user_id' });

// Folder <--> File Relationship
Folder.hasMany(File, { foreignKey: 'parent_folder_id' });
File.belongsTo(Folder, { foreignKey: 'parent_folder_id' });


// Export everything for use in your application
module.exports = {
    sequelize,
    User,
    Folder,
    File
};