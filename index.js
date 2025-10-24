#!/usr/bin/env node
'use strict';

const port = (() => {
    const args = process.argv;

    if (args.length !== 3) {
        console.error("usage: node index.js port");
        process.exit(1);
    }

    const num = parseInt(args[2], 10);
    if (isNaN(num)) {
        console.error("error: argument must be an integer.");
        process.exit(1);
    }

    return num;
})();

const { Prisma } = require("@prisma/client");
const express = require("express");
const app = express();

app.use(express.json());

// ADD YOUR WORK HERE
// import
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

require('dotenv').config();

const jwt = require('jsonwebtoken');
const { v1: uuidv4 } = require('uuid');
const { tr, no } = require("zod/v4/locales");
const { promise } = require("zod/v4");

// recording (like constant)
let lastResetAt = "0000-00-00T00:00:00.000Z";
let lastResetIP = "";

// function
function isValidBirthday(dateString) {
    // check YYYY-MM-DD
    let regex = /^(19[0-9]{2}|20[0-1][0-9]|202[0-5])-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
    if (!regex.test(dateString)) {
        return false;
    }

    // analyse data
    let parts = dateString.split('-');
    let year = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let day = parseInt(parts[2], 10);

    // check data valid
    let date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
        return false;
    }

    // check range 1900-01-01 to 2025-12-31
    let start = new Date(1900, 0, 1);
    let end = new Date(2025, 11, 31);
    return date >= start && date <= end;
}

// Middleware
// check input json
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ "message": 'Invalid JSON input' });
    }
    next();
});

// handle JWT Bearer
const bearerToken = (req, res, next) => {
    const jwtHeader = req.headers['authorization'];
    // error handle - no auth
    if (!jwtHeader) {
        req.role = null;
        return next();
    }
    let encoding = jwtHeader.split(" ")[1];
    let user;
    try {
        user = jwt.verify(encoding, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ "Unauthorized": "Invalid token" });
    }
    if (!user.role) {
        req.role = null;
        return next();
    }
    req.user = user;
    req.role = user.role;
    next();
};

// end points
app.route("/users")
    .post(bearerToken, async (req, res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Cashier or higher"
        if (req.role !== "cashier" && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Cashier or higher" });
        }
        // error handling - 400 Bad Request.
        const { utorid, name, email } = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if (!utorid || !name || !email ||
            typeof (utorid) !== "string" || typeof (name) !== "string" || typeof (email) !== "string") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["utorid", "name", "email"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // not satisfy description
        if (!/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
            return res.status(400).json({ "Bad Request": "Invalid utorid" });
        }
        if (!/^.{1,50}$/.test(name)) {
            return res.status(400).json({ "Bad Request": "Invalid name" });
        }
        if (!/^[^@]+@mail.utoronto.ca$/.test(email)) {
            return res.status(400).json({ "Bad Request": "Invalid email" });
        }
        // error handle - 409 Confilict
        let checjExists;
        try {
            checjExists = await prisma.user.findMany({
                where: {
                    utorid
                }
            });
        } catch (error) {
            console.log(error);
            return res.status(499).json({ message: "Failed to find user" });
        }
        if (checjExists.length !== 0) {
            return res.status(409).json({ "Conflict": "user with that utorid already exists" });
        }
        let newUser;
        // create resetToken & expiresAt
        const resetToken = uuidv4();
        let createdAt = new Date();
        const expiresAt = (new Date(createdAt.getTime() + (7 * 24 * 60 * 60 * 1000))).toISOString();
        try {
            // create user
            newUser = await prisma.user.create({
                data: {
                    utorid,
                    name,
                    email,
                    createdAt: createdAt.toISOString(),
                    resetToken,
                    expiresAt,
                }
            });
        } catch (error) {
            console.log(error);
            return res.status(499).json({ message: "Failed to create new user" });
        }
        return res.status(201).json({
            id: newUser.id,
            utorid: newUser.utorid,
            name: newUser.name,
            email: newUser.email,
            verified: newUser.verified,
            expiresAt: expiresAt,
            resetToken: resetToken
        });
    })
    .get(bearerToken, async (req, res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Manager or higher"
        if (req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Manager or higher" });
        }
        // error handling - 400 Bad Request.
        let { name, role, verified, activated, page, limit } = req.query;
        // extra field
        const allowedFields = ["name", "role", "verified", "activated", "page", "limit"];
        const extraFields = Object.keys(req.query).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // set filter(where) meanwhile
        let where = {};
        // not satisfy description
        if (name !== undefined) {
            where.name = name;
        }
        if (role !== undefined) {
            if (role !== "regular" && role !== "cashier" && role !== "manager" && role !== "superuser") {
                return res.status(400).json({ "Bad Request": "Invalid role" });
            }
            where.role = role;
        }
        if (verified !== undefined) {
            if (!(verified === "true" || verified === "false")) {
                return res.status(400).json({ "Bad Request": "Invalid verified" });
            }
            where.verified = verified === "true";
        }
        if (activated !== undefined) {
            if (!(activated === "true" || activated === "false")) {
                return res.status(400).json({ "Bad Request": "Invalid activated" });
            }
            where.lastLogin = activated === "true" ? { not: null } : null;
        }
        // if no input page or limit, set them to default value
        if (page !== undefined) {
            page = parseInt(page);
            if (Number.isNaN(page) || page <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid page" });
            }
        } else { // no input page
            page = 1;
        }
        if (limit !== undefined) {
            limit = parseInt(limit);
            if (Number.isNaN(limit) || limit <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid limit" });
            }
        } else { // no input limit
            limit = 10;
        }
        // apply all filters
        let results;
        try {
            results = await prisma.user.findMany({
                where: where,
                select: {
                    id: true,
                    utorid: true,
                    name: true,
                    email: true,
                    birthday: true,
                    role: true,
                    points: true,
                    createdAt: true,
                    lastLogin: true,
                    verified: true,
                    avatarUrl: true,
                }
            });
        } catch (error) {
            console.log(error);
            return res.status(499).json({ message: "Failed to find user" });
        }
        return res.status(200).json({
            count: results.length,
            results: results.slice((page - 1) * limit, ((page - 1) * limit) + limit)
        });
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Get & Post" });
    });

app.route("/users/me")
    .patch(bearerToken, async (req, res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Regular or higher"
        if (req.role !== "regular" && req.role !== "cashier" && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Regular or higher" });
        }
        // error handling - 400 Bad Request.
        let { name, email, birthday, avatar } = req.body;
        // no fields
        if (!name && !email && !birthday && !avatar) {
            return res.status(400).json({ "Bad Request": "No update field provied" })
        }
        // extra field
        const allowedFields = ["name", "email", "birthday", "avatar"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // find user by id
        // req.user.id
        let user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            }
        });
        // error handle - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        // set data meanwhile
        let data = {};
        // not satisfy description
        if (name !== undefined && name !== null) {
            if (typeof (name) !== "string" || !/^.{1,50}$/.test(name)) {
                return res.status(400).json({ "Bad Request": "Invalid name" });
            }
            data.name = name;
        }
        if (email !== undefined && email !== null) {
            if (typeof (email) !== "string" || !/^[^@]+@mail.utoronto.ca$/.test(email)) {
                return res.status(400).json({ "Bad Request": "Invalid email" });
            }
            data.email = email;
        }
        if (birthday !== undefined && birthday !== null) {
            if (typeof (birthday) !== "string" || !isValidBirthday(birthday)) {
                return res.status(400).json({ "Bad Request": "Invalid birthday" });
            }
            data.birthday = birthday;
        }
        if (avatar !== undefined && avatar !== null) {
            if (typeof (avatar) !== "string" || !/\/uploads\/avatars\/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|webp|svg)$/i.test(avatar)) {
                return res.status(400).json({ "Bad Request": "Invalid avatar" });
            }
            data.avatar = avatar;
        }
        // update
        let result = await prisma.user.update({
            where: {
                id: req.user.id
            },
            data: data,
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true
            }
        });
        res.status(200).json(result);
    })
    .get(bearerToken, async (req, res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Regular or higher"
        if (req.role !== "regular" && req.role !== "cashier" && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Regular or higher" });
        }
        // find user by id
        let user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            },
            select: {
                id: true,
                utorid: true,
                name: true,
                email: true,
                birthday: true,
                role: true,
                points: true,
                createdAt: true,
                lastLogin: true,
                verified: true,
                avatarUrl: true,
                promotions: true
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        res.status(200).json(user);
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Get & Patch" });
    });

app.route("/users/me/password")
    .patch(bearerToken, async (req, res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Regular or higher"
        if (req.role !== "regular" && req.role !== "cashier" && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Regular or higher" });
        }
        // error handling - 400 Bad Request.
        const { old, new: newPassword } = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if (!old || !newPassword ||
            typeof (old) !== "string" || typeof (newPassword) !== "string") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["old", "new"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // check old password
        let user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        if (user.password !== old) {
            return res.status(403).json({ "Unauthorized": "Incorrect old password" });
        }
        // not satisfy description
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/.test(newPassword)) {
            return res.status(400).json({ "Bad Request": "Invalid password" });
        }
        // update
        await prisma.user.update({
            where: {
                id: req.user.id
            },
            data: {
                password: newPassword
            }
        });
        res.status(200).json();
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Get & Post" });
    });

app.route("/users/:userId")
    .get(bearerToken, async (req, res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Cashier or higher"
        if (req.role !== "cashier" && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Cashier or higher" });
        }
        // process userId
        const userId = parseInt(req.params.userId)
        // error handling - 400 Bad Request
        if (Number.isNaN(userId)) {
            return res.status(400).json({ "Bad Request": "Invalid userId" });
        }
        // get user's information by userId
        // 2 cases: cashier && manager or higher
        let result;
        try {
            if (req.role == "cashier") {
                result = await prisma.user.findUnique({
                    where: {
                        id: userId
                    },
                    select: {
                        id: true,
                        utorid: true,
                        name: true,
                        points: true,
                        verified: true,
                        promotions: true
                    }
                })
            } else {
                result = await prisma.user.findUnique({
                    where: {
                        id: userId
                    },
                    select: {
                        id: true,
                        utorid: true,
                        name: true,
                        email: true,
                        birthday: true,
                        role: true,
                        points: true,
                        createdAt: true,
                        verified: true,
                        avatarUrl: true,
                        promotions: true
                    }
                })
            }
        } catch (error) {
            console.log(error);
            return res.status(499).json({ message: "Failed to find user" });
        }
        // error handling - 404 Not Found
        if (result === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        res.status(200).json(result);
    })
    .patch(bearerToken, async (req, res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Manager or higher"
        if (req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Manager or highe" });
        }
        // error handling - 400 Bad Request.
        let { email, verified, suspicious, role } = req.body;
        // no fields
        if (!email && (verified === undefined || verified === null) && (suspicious === undefined || suspicious === null) && !role) {
            return res.status(400).json({ "Bad Request": "No update fields provided" })
        }
        // extra field
        const allowedFields = ["email", "verified", "suspicious", "role"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // process userId
        const userId = parseInt(req.params.userId)
        // error handling - 400 Bad Request
        if (Number.isNaN(userId)) {
            return res.status(400).json({ "Bad Request": "Invalid userId" });
        }
        // error handling - 404 Not Found
        let user;
        try {
            user = await prisma.user.findMany({
                where: {
                    id: userId
                }
            })
        } catch (error) {
            console.log(error);
            return res.status(499).json({ message: "Failed to find user" });
        }
        if (user.length === 0) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        // error handling - 400 Bad Request
        // set data meanwhile
        let data = {};
        let select = {
            id: true,
            utorid: true,
            name: true
        };
        // not satisfy description
        if (email !== undefined && email !== null) {
            if (typeof (email) !== "string" || !/^[^@]+@mail.utoronto.ca$/.test(email)) {
                return res.status(400).json({ "Bad Request": "Invalid email" });
            }
            data.email = email;
            select.email = true;
        }
        if (verified !== undefined && verified !== null) {
            if (typeof (verified) !== "boolean" || verified !== true) {
                return res.status(400).json({ "Bad Request": "Invalid verified" });
            }
            data.verified = verified;
            select.verified = true;
        }
        if (suspicious !== undefined && suspicious !== null) {
            if (typeof (suspicious) !== "boolean") {
                return res.status(400).json({ "Bad Request": "Invalid suspicious" });
            }
            data.suspicious = suspicious;
            select.suspicious = true;
        }
        if (role !== undefined && role !== null) {
            if (typeof (role) !== "string" || (role !== "cashier" && role !== "regular" && role !== "manager" && role !== "superuser")) {
                return res.status(400).json({ "Bad Request": "Invalid role" });
            }
            if (req.role === "manager" && (role === "manager" || role === "superuser")) {
                return res.status(403).json({ "Bad Request": "Unauthorized role change" });
            }
            if (user[0].role === "regular" && role === "cashier" && user[0].suspicious === true) {
                return res.status(400).json({ "Bad Request": "Invalid role (suspicious)" })
            }
            data.role = role;
            select.role = true;
        }
        // update
        let result;
        try {
            result = await prisma.user.update({
                where: {
                    id: userId
                },
                data: data,
                select: select
            });
        } catch (error) {
            console.log(error);
            return res.status(499).json({ message: "Failed to update user" });
        }
        res.status(200).json(result);
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Get & Patch" });
    });

app.route("/auth/tokens")
    .post(async (req, res) => {
        // error handling - 400 Bad Request.
        const { utorid, password } = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if (!utorid || !password || typeof (utorid) !== "string" || typeof (password) !== "string") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["utorid", "password"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // not satisfy description
        if (!/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
            return res.status(400).json({ "Bad Request": "Invalid utorid" });
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/.test(password)) {
            return res.status(400).json({ "Bad Request": "Invalid password" });
        }
        // find user by utorid
        let user;
        user = await prisma.user.findUnique({
            where: {
                utorid: utorid
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ message: "No user with given utorid" });
        }
        if (user.password === null || user.password !== password) {
            return res.status(401).json({ message: "Incorrect password" });
        }
        let tokenPayload = {
            id: user.id,
            utorid: user.utorid,
            role: user.role
        };
        await prisma.user.update({
            where: {
                utorid: utorid
            },
            data: {
                lastLogin: (new Date()).toISOString()
            }
        });
        const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000));
        return res.status(200).json({
            "token": jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "1d" }),
            "expiresAt": expiresAt.toISOString()
        })
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Post" });
    });

app.route("/auth/resets")
    .post(async (req, res) => {
        // error handling - 400 Bad Request.
        const { utorid } = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if (!utorid || typeof (utorid) !== "string") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["utorid"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // not satisfy description
        if (!/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
            return res.status(400).json({ "Bad Request": "Invalid utorid" });
        }
        // error handle - 429 Too Many Requests
        let now = new Date();
        if (now - lastResetAt < 60000 && req.ip === lastResetIP) {
            return res.status(429).json({ message: "Too Many Requests" });
        }
        // find user by utorid
        let user;
        try {
            user = await prisma.user.findUnique({
                where: {
                    utorid: utorid
                }
            })
        } catch (error) {
            console.log(error);
            return res.status(499).json({ message: "Failed to find user" });
        }
        // erroe handle - 404 Not Found
        if (user === null) {
            return res.status(404).json({ message: "No user with given utorid" });
        }
        // update
        const resetToken = uuidv4();
        lastResetIP = req.ip;
        lastResetAt = new Date();
        const expiresAt = new Date(lastResetAt + (7 * 24 * 60 * 60 * 1000)).toISOString();
        let updateUser;
        try {
            updateUser = await prisma.user.update({
                where: {
                    utorid
                },
                data: {
                    resetToken,
                    expiresAt,
                }
            })
        } catch (error) {
            console.log(error);
            return res.status(499).json({ message: "Failed to update user" });
        }
        return res.status(202).json({
            "resetToken": updateUser.resetToken,
            "expiresAt": updateUser.expiresAt
        });
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Post" });
    });

app.route("/auth/resets/:resetToken")
    .post(async (req, res) => {
        const token = req.params.resetToken;
        // error handling - 400 Bad Request.
        const { utorid, password } = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if (!utorid || !password || typeof (utorid) !== "string" || typeof (password) !== "string") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["utorid", "password"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // not satisfy description
        if (!/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
            return res.status(400).json({ "Bad Request": "Invalid utorid" });
        }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/.test(password)) {
            return res.status(400).json({ "Bad Request": "Invalid password" });
        }
        // find user
        let user;
        user = await prisma.user.findMany({
            where: {
                resetToken: token
            }
        });
        // error handle - 404 Not Found
        if (user.length === 0) {
            return res.status(404).json({ "Not Found": "Token not found" });
        }
        user = user[0];
        // error handle - 401 Unauthorized
        if (user.utorid !== utorid) {
            return res.status(401).json({ "Unauthorized": "Token does not match user" });
        }
        // error handle - 410 Gone
        if (user.expiresAt === "gone") {
            return res.status(410).json({ "Gone": "Token expired" });
        }
        // reset password
        await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                password: password
            }
        });
        res.status(200).json();
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Post" });
    });

app.route("/events")
    .post(bearerToken, async (req, res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Manager or higher"
        if (req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Manager or higher" });
        }
        // error handling - 400 Bad Request.
        const { name, description, location, startTime, endTime, capacity, points } = req.body;
        // invalid payload:
        // missing required field & not appropriate type
        if (!name || !description || !location || !startTime || !endTime || points === undefined ||
            typeof (name) !== "string" || typeof (description) !== "string" ||
            typeof (location) !== "string" || typeof (startTime) !== "string" ||
            typeof (endTime) !== "string" || typeof (points) !== "number") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // extra field
        const allowedFields = ["name", "description", "location", "startTime", "endTime", "capacity", "points"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // not satisfy description
        let data = {};
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6}\+\d{2}:\d{2}$/.test(startTime)) {
            return res.status(400).json({ "Bad Request": "Invalid startTime" });
        }
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6}\+\d{2}:\d{2}$/.test(endTime) || startTime >= endTime) {
            return res.status(400).json({ "Bad Request": "Invalid endTime" });
        }
        if (!Number.isInteger(points) || points <= 0) {
            return res.status(400).json({ "Bad Request": "Invalid points" });
        }
        if (typeof (capacity) === "number") {
            if (capacity <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid capacity" });
            }
            data.capacity = parseInt(capacity);
        }
        // init data
        data.name = name;
        data.description = description;
        data.location = location;
        data.startTime = startTime.split('.')[0] + 'Z';
        data.endTime = endTime.split('.')[0] + 'Z';
        data.pointsRemain = points;
        // create event
        let result = await prisma.event.create({
            data: data,
            select: {
                id: true,
                name: true,
                description: true,
                location: true,
                startTime: true,
                endTime: true,
                capacity: true,
                pointsRemain: true,
                pointsAwarded: true,
                published: true,
                organizers: true,
                guests: true
            }
        });
        res.status(201).json(result);
    })
    .get(bearerToken, async (req, res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Regular or higher"
        if (req.role !== "regular" && req.role !== "cashier" && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Regular or higher" });
        }
        // error handling - 400 Bad Request.
        let { name, location, started, ended, showFull, page, limit, published } = req.query;
        // extra field
        const allowedFields = ["name", "location", "started", "ended", "showFull", "page", "limit", "published"];
        const extraFields = Object.keys(req.query).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // set filter(where) meanwhile
        console.log(req.role);
        console.log(req.query);
        let where = {};
        // not satisfy description
        if (name !== undefined && name !== null) {
            where.name = name;
        }
        if (location !== undefined && location !== null) {
            where.location = location;
        }
        if (started !== undefined && started !== null) {
            if (!(started === "true" || started === "false")) {
                return res.status(400).json({ "Bad Request": "Invalid started" });
            }
            if (started === "true") {
                where.startTime = { lt: (new Date()).toISOString() };
            } else {
                where.startTime = { gte: (new Date()).toISOString() };
            }
        }
        if (ended !== undefined && ended !== null) {
            if (!(ended === "true" || ended === "false")) {
                return res.status(400).json({ "Bad Request": "Invalid started" });
            }
            if (started !== undefined && started !== null) {
                return res.status(400).json({ "Bad Request": "Not permitted to use both started and ended" });
            }
            if (ended === "true") {
                where.endTime = { lt: (new Date()).toISOString() };
            } else {
                where.endTime = { gte: (new Date()).toISOString() };
            }
        }
        if (showFull !== undefined && showFull !== null) {
            if (!(showFull === "true" || showFull === "false")) {
                return res.status(400).json({ "Bad Request": "Invalid showFull" });
            }
            if (showFull === "true") {
                // no filter
            } else {
                where.OR = [
                    { capacity: null },
                    { attendees: { lt: prisma.event.capacity } }
                ];
            }
        }
        // if no input page or limit, set them to default value
        if (page !== undefined) {
            page = parseInt(page);
            if (Number.isNaN(page) || page <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid page" });
            }
        } else { // no input page
            page = 1;
        }
        if (limit !== undefined) {
            limit = parseInt(limit);
            if (Number.isNaN(limit) || limit <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid limit" });
            }
        } else { // no input limit
            limit = 10;
        }
        //published filter
        if (published !== undefined && published !== null) {
            if (!(published === "true" || published === "false")) {
                return res.status(400).json({ "Bad Request": "Invalid published" });
            }
            if (req.role === "regular" || req.role === "cashier") {
                return res.status(403).json({ "Forbidden": "Not permit to use published filter" });
            }
            where.published = published === "true";
        } else {
            if (req.role === "regular") {
                where.published = false;
            }
        }
        // set select
        let select = {
            id: true,
            name: true,
            location: true,
            startTime: true,
            endTime: true,
            capacity: true,
            numGuests: true,
        }
        if (req.role !== "regular" && req.role !== "cashier") {
            select.pointsRemain = true;
            select.pointsAwarded = true;
            select.published = true;
        }
        // apply all filters
        let results;
        try {
            results = await prisma.event.findMany({
                where: where,
                select: select
            });
        } catch (error) {
            console.log(error);
            return res.status(499).json({ message: "Failed to find user" });
        }
        return res.status(200).json({
            count: results.length,
            results: results.slice((page - 1) * limit, ((page - 1) * limit) + limit)
        });
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Get & Post" });
        const { id, name, type, minSpending, rate, points, userId, user } = req.body;
    });

app.route("/promotions")
    .post(bearerToken, async (req, res) => {
        // check authorizaiton first
        // error handle - 401 Unauthorized
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        if (req.role != "manager" && req.role != "superuser") {
            return res.status(403).json({ "Forbidden": "Not permited to post promotions" });
        }
        // get the data
        const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;
        // error handle - 400 Bad Request
        // validate requeired fields
        if (!name || !description || !type || !startTime || !endTime ||
            typeof (name) !== "string" || typeof (description) !== "string" ||
            typeof (type) !== "string" || typeof (startTime) !== "string" ||
            typeof (endTime) !== "string") {
            return res.status(400).json({ "Bad Request": "Invalid payload" });
        }
        // validate optional fields
        var data = {};
        if (minSpending) {
            if (typeof (minSpending) !== "number" || isNaN(minSpending) || minSpending <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid minSpending" });
            }
            data.minSpending = minSpending;
        }
        if (rate) {
            if (typeof (rate) !== "number" || isNaN(rate) || rate <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid rate" });
            }
            data.rate = rate;
        }
        if (points) {
            if (typeof (points) !== "number" || !Number.isInteger(points) || points <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid points" });
            }
            data.points = points;
        }
        // extra field
        const allowedFields = ["name", "description", "type", "startTime", "endTime", "minSpending", "rate", "points"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // not satisfy description
        if (type !== "automatic" && type !== "one-time") {
            return res.status(400).json({ "Bad Request": "Invalid type" });
        }
        const startDate = new Date(startTime);
        const now = new Date();
        const endDate = new Date(endTime);
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(startTime)) {
            return res.status(400).json({ "Bad Request": "Invalid startTime" });
        }
        if (startDate < now) {
            return res.status(400).json({ "Bad Request": "startTime must not be in the past" });
        }
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(endTime)) {
            return res.status(400).json({ "Bad Request": "Invalid endTime" });
        }
        if (endDate <= startDate) {
            return res.status(400).json({ "Bad Request": "endTime must be after startTime" });
        }
        // init data
        data.name = name;
        data.description = description;
        data.type = type;
        data.startTime = startTime.split('.')[0] + 'Z';
        data.endTime = endTime.split('.')[0] + 'Z';
        try {
            var result = await prisma.promotion.create({
                data: data,
            });
        } catch (error) {
            console.log(error);
            return res.status(499).json({ message: "Failed to post promotion" });
        }
        const users = await prisma.user.findMany();
        for (const user of users) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    promotions: {
                        connect: { id: result.id }
                    }
                }
            });
        }
        return res.status(201).json(result);
    })
    .get(bearerToken, async (req, res) => {
        // check authorizaiton first
        // error handle - 401 Unauthorized
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - possible fileds for regular or higher
        var where = {};
        var { name, type, page, limit } = req.query;
        if (name) {
            if (typeof (name) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid name" });
            }
            where.name = name;
        }
        if (type) {
            if (typeof (type) !== "string" || (type !== "automatic" && type !== "one-time")) {
                return res.status(400).json({ "Bad Request": "Invalid type" });
            }
            where.type = type;
        }
        if (page) {
            if (isNaN(parseFloat(page)) || parseFloat(page) <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid page" });
            }
        } else {
            page = 1;
        }
        if (limit) {
            if (isNaN(parseFloat(limit)) || parseFloat(limit) <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid limit" });
            }
        } else {
            limit = 10;
        }
        // extra params
        const allowedParams = ["name", "type", "page", "limit", "started", "ended"];
        const extraParams = Object.keys(req.query).filter((paramas) => {
            return !allowedParams.includes(paramas);
        });
        if (extraParams.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraParams,
            });
        }
        // check if user is manager or higher
        if (req.role === "manager" || req.role === "superuser") {
            var { started, ended } = req.query;
            if (started && ended) {
                return res.status(400).json({ "Bad Request": "Both started and ended exist" });
            }
            if (started) {
                if (started === "true") {
                    where.startTime = { lt: (new Date()).toISOString() };
                }
                else {
                    where.startTime = { gte: (new Date()).toISOString() };
                }
            }
            if (ended) {
                if (ended === "true") {
                    where.endTime = { lt: (new Date()).toISOString() };
                }
                else {
                    where.endTime = { gte: (new Date()).toISOString() };
                }
            }
        } else {
            // Regular user only see the active promotions
            const userData = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { promotions: true },
            });

            const now = new Date();

            // Filter only active promotions (started and not ended)
            const activePromotions = userData.promotions.filter(promo => {
                const start = new Date(promo.startTime);
                const end = new Date(promo.endTime);
                return start < now && end > now;
            });

            return res.status(200).json({
                count: activePromotions.length,
                results: activePromotions,
            });
        }

        var results = await prisma.promotion.findMany({
            where: where,
            skip: (page - 1) * limit,
            take: limit,
        });
        return res.status(200).json({
            count: results.length,
            results: results
        });
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Get & Post" });
    });

app.route("/promotions/:promotionId")
    .get(bearerToken, async (req, res) => {
        // check authorizaiton first
        // error handle - 401 Unauthorized
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        const promotionId = parseInt(req.params.promotionId);
        // error handling - 400 Bad Request
        if (!promotionId || isNaN(promotionId)) {
            return res.status(400).json({ "Bad Request": "Invalid promotionId" });
        }
        var result = await prisma.promotion.findUnique({
            where: {
                id: promotionId
            }
        });
        // error handling - 404 Not Found
        if (result === null) {
            return res.status(404).json({ "Not Found": "Promotion not found" });
        }
        if (req.role === "regular" || req.role === "cashier") {
            // 404 Not found if the promotion is not started yet or has ended
            const now = new Date();
            const startDate = new Date(result.startTime);
            const endDate = new Date(result.endTime);
            if (now < startDate || now > endDate) {
                return res.status(404).json({ "Not Found": "Promotion not found" });
            }
        }
        return res.status(200).json(result);
    })
    .patch(bearerToken, async (req, res) => {
        // check authorizaiton first
        // error handle - 401 Unauthorized
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        if (req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Not permited to update promotions" });
        }
        // error handling - 400 Bad Request.
        let data = {};
        const promotionId = parseInt(req.params.promotionId);
        if (isNaN(promotionId)) {
            return res.status(400).json({ "Bad Request": "Invalid promotionId" });
        }
        const { name, description, type, startTime, endTime, minSpending, rate, points } = req.body;
        if (name) {
            if (typeof (name) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid name" });
            }
            data.name = name;
        }
        if (description) {
            if (typeof (description) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid description" });
            }
            data.description = description;
        }
        if (type) {
            if (typeof (type) !== "string" || (type !== "automatic" && type !== "one-time")) {
                return res.status(400).json({ "Bad Request": "Invalid type" });
            }
            data.type = type;
        }
        if (startTime) {
            if (typeof (startTime) !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(startTime)) {
                return res.status(400).json({ "Bad Request": "Invalid startTime" });
            }
            data.startTime = startTime.split('.')[0] + 'Z';
        }
        if (endTime) {
            if (typeof (endTime) !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(endTime)) {
                return res.status(400).json({ "Bad Request": "Invalid endTime" });
            }
            const startData = new Date(startTime);
            const endData = new Date(endTime);
            if (startTime && endData <= startData) {
                return res.status(400).json({ "Bad Request": "endTime must be after startTime" });
            }
            data.endTime = endTime.split('.')[0] + 'Z';
        }
        if (minSpending) {
            if (typeof (minSpending) !== "number" || isNaN(minSpending) || minSpending <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid minSpending" });
            }
            data.minSpending = minSpending;
        }
        if (rate) {
            if (typeof (rate) !== "number" || isNaN(rate) || rate <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid rate" });
            }
            data.rate = rate;
        }
        if (points) {
            if (typeof (points) !== "number" || !Number.isInteger(points) || !isNaN(points) || points <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid points" });
            }
            data.points = points;
        }
        // extra field
        let allowedFields = ["name", "description", "type", "startTime", "endTime", "minSpending", "rate", "points"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        // if update to name/description/type/startTime/minSpending/rate/points, recheck original startime
        if (data.name || data.description || data.type || data.startTime || data.minSpending || data.rate || data.points) {
            let originalPromotion;

            try {
                originalPromotion = await prisma.promotion.findUnique({
                    where: {
                        id: promotionId
                    }
                });
                console.log(originalPromotion);
            } catch (error) {
                console.log(error);
                return res.status(499).json({ message: "Failed to find promotion" });
            }
            console.log(originalPromotion);
            const originalStartDate = new Date(originalPromotion.startTime);
            const now = new Date();
            if (now >= originalStartDate) {
                return res.status(400).json({ "Bad Request": "Original start time has passed" });
            }
        }
        // if update to endTime, recheck original endtime
        if (data.endTime) {
            try {
                var originalPromotion = await prisma.promotion.findUnique({
                    where: {
                        id: promotionId
                    }
                });
            } catch (error) {
                console.log(error);
                return res.status(499).json({ message: "Failed to find promotion" });
            }
            console.log(originalPromotion);
            const originalEndDate = new Date(originalPromotion.endTime);
            const now = new Date();
            if (now >= originalEndDate) {
                return res.status(400).json({ "Bad Request": "Original end time has passed" });
            }
        }
        // check if the update time is not in the past
        if (data.startTime) {
            const startDate = new Date(data.startTime);
            const now = new Date();
            if (startDate < now) {
                return res.status(400).json({ "Bad Request": "startTime must not be in the past" });
            }
        }
        if (data.endTime) {
            const endDate = new Date(data.endTime);
            const now = new Date();
            if (endDate < now) {
                return res.status(400).json({ "Bad Request": "endTime must not be in the past" });
            }
        }
        // update
        try {
            var result = await prisma.promotion.update({
                where: {
                    id: promotionId
                },
                data: data,
            });
        } catch (error) {
            console.log(error);
            return res.status(499).json({ message: "Failed to update promotion" });
        }
        var always = {};
        always.id = result.id;
        always.name = result.name;
        always.type = result.type;
        const merged = { ...always, ...data };
        return res.status(200).json(merged);
    })
    .delete(bearerToken, async (req, res) => {
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        if (req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Not permited to delete promotions" });
        }
        const promotionId = parseInt(req.params.promotionId);
        if (isNaN(promotionId)) {
            return res.status(400).json({ "Bad Request": "Invalid promotionId" });
        }
        try {
            let result = await prisma.promotion.delete({
                where: {
                    id: promotionId
                }
            });
        } catch (error) {
            console.log(error);
            return res.status(499).json({ message: "Failed to delete promotion" });
        }
        const startDate = new Date(result.startTime);
        const now = new Date();
        if (now >= startDate) {
            return res.status(400).json({ "Bad Request": "Cannot delete started promotion" });
        }
        return res.status(204).json({ "Success": "No Content" });
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Get & Patch & Delete" });
    });


const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});