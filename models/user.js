const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const User = sequelize.define('User', {
    userId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'user_id'
    },
    uuid: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        unique: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash'
    },
    emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'email_verified'
    },
    profileImageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true, // It can be null
        field: 'profile_image_url'
    },
    verificationCode: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'verification_code'
    },
    verificationCodeExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'verification_code_expires_at'
    },
    passwordResetCode: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'password_reset_code'
    },
    passwordResetExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'password_reset_expires_at'
    },
    pendingEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'pending_email'
    },
    emailChangeCode: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'email_change_code'
    },
    emailChangeExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'email_change_expires_at'
    },
    profileImagePublicId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'profile_image_public_id'
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = User;