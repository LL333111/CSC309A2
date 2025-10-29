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
const { tr, no, ca, id } = require("zod/v4/locales");
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
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6}\+\d{2}:\d{2}$/.test(startTime) || (new Date(startTime)).toISOString() <= (new Date()).toISOString()) {
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
                    { numGuests: { lt: prisma.event.fields.capacity } }
                ];
            }
        } else {
            // default no show full events
            where.OR = [
                { capacity: null },
                { numGuests: { lt: prisma.event.fields.capacity } }
            ];
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
            if (req.role === "regular" || req.role === "cashier") {
                where.published = true;
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
    });

app.route("/events/:eventId")
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
        // process eventId
        const eventId = parseInt(req.params.eventId);
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                organizers: true
            }
        });
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        // get organizer ids
        const organizerIds = event.organizers.map((org) => org.id);
        let select = {
            id: true,
            name: true,
            description: true,
            location: true,
            startTime: true,
            endTime: true,
            capacity: true
        }
        if (organizerIds.includes(req.user.id) || req.role === "manager" || req.role === "superuser") {
            select.pointsRemain = true;
            select.pointsAwarded = true;
            select.published = true;
            select.organizers = true,
                select.guests = true;
        } else {
            if (event.published === false) {
                return res.status(404).json({ "Not Found": "Event not visible" });
            }
            select.organizers = true,
                select.numGuests = true
        }
        let result = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            select: select
        });
        res.status(200).json(result);
    })
    .patch(bearerToken, async (req, res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // get organizers of the event
        const eventId = parseInt(req.params.eventId)
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                organizers: true
            }
        });
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        // get organizer ids
        const organizerIds = event.organizers.map((org) => org.id);
        // if not organizer && not "Manager or higher"
        if (!organizerIds.includes(req.user.id) && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Manager or higher or organizer" });
        }
        // error handling - 400 Bad Request.
        let { name, description, location, startTime, endTime, capacity, points, published } = req.body;
        // extra field
        const allowedFields = ["name", "description", "location", "startTime", "endTime", "capacity", "points", "published"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        let data = {};
        let select = {
            id: true,
            name: true,
            location: true
        };
        if (name !== undefined && name !== null) {
            if (typeof (name) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid name" });
            }
            if ((new Date(event.startTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Cannot update name of started event" });
            }
            data.name = name;
            select.name = true;
        }
        if (description !== undefined && description !== null) {
            if (typeof (description) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid description" });
            }
            if ((new Date(event.startTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Cannot update description of started event" });
            }
            data.description = description;
            select.description = true;
        }
        if (location !== undefined && location !== null) {
            if (typeof (location) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid location" });
            }
            if ((new Date(event.startTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Cannot update location of started event" });
            }
            data.location = location;
            // location is always selected
        }
        if (startTime !== undefined && startTime !== null) {
            if (typeof (startTime) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid startTime" });
            }
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6}\+\d{2}:\d{2}$/.test(startTime) || (new Date(startTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Invalid startTime" });
            }
            if ((new Date(event.startTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Cannot update startTime of started event" });
            }
            if (endTime === undefined && endTime === null) { // 10
                // check id startTime < existing endTime
                if (startTime >= event.endTime) {
                    return res.status(400).json({ "Bad Request": "Invalid startTime" });
                }
            }
            data.startTime = startTime.split('.')[0] + 'Z';
            select.startTime = true;
        }
        if (endTime !== undefined && endTime !== null) {
            if (typeof (endTime) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid endTime" });
            }
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{6}\+\d{2}:\d{2}$/.test(endTime) || (new Date(endTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Invalid endTime" });
            }
            if ((new Date(event.endTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Cannot update endTime of ended event" });
            }
            if (startTime === undefined && startTime === null) { // 01
                // check endTime > existing startTime
                if (endTime <= event.startTime) {
                    return res.status(400).json({ "Bad Request": "Invalid endTime" });
                }
            } else { // 11
                // startTime is also provided
                // check endTime > startTime
                if (startTime >= endTime) {
                    return res.status(400).json({ "Bad Request": "Invalid startTime and endTime" });
                }
            }
            data.endTime = endTime.split('.')[0] + 'Z';
            select.endTime = true;
        }
        if (capacity !== undefined && capacity !== null) {
            if (typeof (capacity) !== "number") {
                return res.status(400).json({ "Bad Request": "Invalid capacity" });
            }
            if (capacity <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid capacity" });
            }
            // special checks
            if ((new Date(event.startTime)).toISOString() <= (new Date()).toISOString()) {
                return res.status(400).json({ "Bad Request": "Cannot update capacity of started event" });
            }
            if (event.capacity === null || capacity < event.capacity) {
                if (capacity < event.numGuests) {
                    return res.status(400).json({ "Bad Request": "Invalid capacity" });
                }
            }
            data.capacity = capacity === null ? null : parseInt(capacity);
            select.capacity = true;
        }
        if (points !== undefined && points !== null) {
            if (organizerIds.includes(req.user.id)) {
                return res.status(403).json({ "Forbidden": "Organizer can not change points" });
            }
            if (typeof (points) !== "number") {
                return res.status(400).json({ "Bad Request": "Invalid points" });
            }
            points = parseInt(points);
            if (Number.isNaN(points) || points <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid points" });
            }
            if (points < event.pointsAwarded) {
                return res.status(400).json({ "Bad Request": "Invalid points" });
            }
            data.pointsRemain = points - event.pointsAwarded;
            select.pointsRemain = true;
        }
        if (published !== undefined && published !== null) {
            if (organizerIds.includes(req.user.id)) {
                return res.status(403).json({ "Forbidden": "Organizer can not change published" });
            }
            if (typeof (published) !== "boolean" || published !== true) {
                return res.status(400).json({ "Bad Request": "Invalid published" });
            }
            data.published = published;
            select.published = true;
        }
        // update
        let result = await prisma.event.update({
            where: {
                id: eventId
            },
            data: data,
            select: select
        });
        res.status(200).json(result);
    })
    .delete(bearerToken, async (req, res) => {
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
        // process eventId
        const eventId = parseInt(req.params.eventId)
        // error handling - 400 Bad Request
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        // find event by eventId
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                organizers: true,
                guests: true
            }
        });
        // error handling - 404 Not Found
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        // error handle - 400 Bad Request
        if (event.published === true) {
            return res.status(400).json({ "Bad Request": "Event has already been published" });
        }
        // disconnect all organizers and guests
        const organizerIds = event.organizers.map((org) => org.id);
        for (let oid of organizerIds) {
            await prisma.event.update({
                where: {
                    id: eventId
                },
                data: {
                    organizers: {
                        disconnect: { id: oid }
                    }
                }
            });
        }
        const guestsIds = event.guests.map((org) => org.id);
        for (let gid of guestsIds) {
            await prisma.event.update({
                where: {
                    id: eventId
                },
                data: {
                    guests: {
                        disconnect: { id: gid }
                    },
                    numGuests: { decrement: 1 }
                }
            });
        }
        // delete event
        await prisma.event.delete({
            where: {
                id: eventId
            }
        });
        res.status(204).json();
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Get, Patch & Delete" });
    });

app.route("/events/:eventId/organizers")
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
                extraFields
            });
        }
        // not satisfy description
        if (!/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
            return res.status(400).json({ "Bad Request": "Invalid utorid" });
        }
        // find user by utorid
        let user = await prisma.user.findUnique({
            where: {
                utorid
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        // process eventId
        const eventId = parseInt(req.params.eventId)
        // error handling - 400 Bad Request
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        // find event by eventId
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            }
        });
        // error handling - 404 Not Found
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        // error handle - 410 Gone
        if (event.endTime < (new Date()).toISOString()) {
            return res.status(410).json({ "Gone": "Event has ended" });
        }
        // error handle - 400 Bad Request
        // check if user is already an guest
        let guests = await prisma.event.findMany({
            where: {
                id: eventId,
                guests: {
                    some: {
                        id: user.id
                    }
                }
            }
        });
        if (guests.length > 0) {
            return res.status(400).json({ "Bad Request": "User is already an guests" });
        }
        // add organizer
        let result = await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                organizers: {
                    connect: { id: user.id }
                }
            },
            select: {
                id: true,
                name: true,
                location: true,
                organizers: true
            }
        });
        res.status(201).json(result);
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Post" });
    });

app.route("/events/:eventId/organizers/:userId")
    .delete(bearerToken, async (req, res) => {
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
        // process eventId
        const eventId = parseInt(req.params.eventId)
        // error handling - 400 Bad Request
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        // find event by eventId
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            }
        });
        // error handling - 404 Not Found
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        // process userId
        const userId = parseInt(req.params.userId)
        // error handling - 400 Bad Request
        if (Number.isNaN(userId)) {
            return res.status(400).json({ "Bad Request": "Invalid userId" });
        }
        // find user by userId
        let user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        // error handle - 400 Bad Request
        // check if user is an organizer
        let guests = await prisma.event.findMany({
            where: {
                id: eventId,
                organizers: {
                    some: {
                        id: userId
                    }
                }
            }
        });
        if (guests.length === 0) {
            return res.status(400).json({ "Bad Request": "User is not an organizer" });
        }
        // remove organizer
        await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                organizers: {
                    disconnect: { id: userId }
                }
            }
        });
        res.status(204).json();
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Delete" });
    });

app.route("/events/:eventId/guests")
    .post(bearerToken, async (req, res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // get organizers of the event
        // process eventId
        const eventId = parseInt(req.params.eventId)
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        // find event by eventId
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                organizers: true,
                guests: true
            }
        });
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        // get organizer ids
        const organizerIds = event.organizers.map((org) => org.id);
        // if not organizer && not "Manager or higher"
        if (!organizerIds.includes(req.user.id) && req.role !== "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Manager or higher or organizer" });
        }
        // error handle - 404 Not Found
        if (event.published === false) {
            return res.status(404).json({ "Not Found": "Not visible yet" });
        }
        // error handle - 400 Bad Request.
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
                extraFields
            });
        }
        // not satisfy description
        if (!/^[a-zA-Z0-9]{7,8}$/.test(utorid)) {
            return res.status(400).json({ "Bad Request": "Invalid utorid" });
        }
        // find user by utorid
        let user = await prisma.user.findUnique({
            where: {
                utorid
            },
            select: {
                id: true,
                utorid: true,
                name: true
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        // error handle - 410 Gone
        if ((new Date(event.endTime)).toISOString() <= (new Date()).toISOString()) {
            return res.status(410).json({ "Gone": "Event has ended" });
        }
        console.log(event.numGuests === event.guests.length);

        if (event.capacity !== null) {
            if (event.numGuests === event.capacity) {
                return res.status(410).json({ "Gone": "Event is full" });
            }
        }
        // error handle - 400 Bad Request
        // check if user is already an organizer
        let organizers = await prisma.event.findMany({
            where: {
                id: eventId,
                organizers: {
                    some: {
                        id: user.id
                    }
                }
            }
        });
        if (organizers.length > 0) {
            return res.status(400).json({ "Bad Request": "User is already an organizer" });
        }
        // add guest
        let newEvent = await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                guests: {
                    connect: { id: user.id }
                },
                numGuests: { increment: 1 }
            },
            select: {
                id: true,
                name: true,
                location: true,
                numGuests: true
            }
        });
        let result = {
            id: newEvent.id,
            name: newEvent.name,
            location: newEvent.location,
            guestAdded: user,
            numGuests: newEvent.numGuests
        };
        res.status(201).json(result);
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Post" });
    });

app.route("/events/:eventId/guests/me")
    .post(bearerToken, async (req, res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // Regular
        if (req.role !== "regular") {
            return res.status(403).json({ "Forbidden": "Regular" });
        }
        // get organizers of the event
        // process eventId
        const eventId = parseInt(req.params.eventId)
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        // find event by eventId
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                organizers: true,
                guests: true
            }
        });
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        // get organizer ids
        const organizerIds = event.organizers.map((org) => org.id);
        if (organizerIds.includes(req.user.id)) {
            return res.status(400).json({ "Bad Request": "User already be an organizer" });
        }
        // get guest ids
        const guestIds = event.guests.map((org) => org.id);
        if (guestIds.includes(req.user.id)) {
            return res.status(400).json({ "Bad Request": "User already be a guest" });
        }
        // error handle - 404 Not Found
        if (event.published === false) {
            return res.status(404).json({ "Not Found": "Not visible yet" });
        }
        // find user by utorid
        let user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            },
            select: {
                id: true,
                utorid: true,
                name: true
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        // error handle - 410 Gone
        if (event.endTime < (new Date()).toISOString()) {
            return res.status(410).json({ "Gone": "Event has ended" });
        }
        if (event.capacity !== null) {
            if (event.numGuests >= event.capacity) {
                return res.status(410).json({ "Gone": "Event is full" });
            }
        }
        // add guest
        let newEvent = await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                guests: {
                    connect: { id: req.user.id }
                },
                numGuests: { increment: 1 }
            },
            select: {
                id: true,
                name: true,
                location: true,
                numGuests: true
            }
        });
        let result = {
            id: newEvent.id,
            name: newEvent.name,
            location: newEvent.location,
            guestAdded: user,
            numGuests: newEvent.numGuests
        };
        res.status(201).json(result);
    })
    .delete(bearerToken, async (req, res) => {
        // error handle - 401 Unauthorized
        // no auth:
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // error handling - 403 Forbidden
        // if not "Regular"
        if (req.role !== "regular") {
            return res.status(403).json({ "Forbidden": "Regular" });
        }
        // process eventId
        const eventId = parseInt(req.params.eventId)
        // error handling - 400 Bad Request
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        // find event by eventId
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                organizers: true,
                guests: true
            }
        });
        // error handling - 404 Not Found
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        const guestIds = event.guests.map((org) => org.id);
        if (!guestIds.includes(req.user.id)) {
            return res.status(404).json({ "Not Found": "User is not a user of this event" });
        }
        const organizerIds = event.organizers.map((org) => org.id);
        if (organizerIds.includes(req.user.id)) {
            return res.status(403).json({ "Forbidden": "User is an organizer of this event" });
        }
        // find user by req.user.id
        let user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        if (event.endTime < (new Date()).toISOString()) {
            return res.status(410).json({ "Gone": "Event has ended" });
        }
        // remove guest
        await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                guests: {
                    disconnect: { id: req.user.id }
                },
                numGuests: { decrement: 1 }
            }
        });
        res.status(204).json();
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Post & Delete" });
    });

app.route("/events/:eventId/guests/:userId")
    .delete(bearerToken, async (req, res) => {
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
        // process eventId
        const eventId = parseInt(req.params.eventId)
        // error handling - 400 Bad Request
        if (Number.isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        // find event by eventId
        let event = await prisma.event.findUnique({
            where: {
                id: eventId
            },
            include: {
                organizers: true,
                guests: true
            }
        });
        // error handling - 404 Not Found
        if (event === null) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        const organizerIds = event.organizers.map((org) => org.id);
        // not organizer self-remove
        if (organizerIds.includes(req.user.id)) {
            return res.status(403).json({ "Forbidden": "self-remove is not allowed" });
        }
        // process userId
        const userId = parseInt(req.params.userId)
        // error handling - 400 Bad Request
        if (Number.isNaN(userId)) {
            return res.status(400).json({ "Bad Request": "Invalid userId" });
        }
        // find user by userId
        let user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        // error handling - 404 Not Found
        if (user === null) {
            return res.status(404).json({ "Not Found": "User not found" });
        }
        // error handle - 400 Bad Request
        // check if user is an guest
        const guestsIds = event.guests.map((org) => org.id);
        if (!guestsIds.includes(userId)) {
            return res.status(400).json({ "Bad Request": "User is not an guest" });
        }
        // remove organizer
        await prisma.event.update({
            where: {
                id: eventId
            },
            data: {
                guests: {
                    disconnect: { id: userId }
                },
                numGuests: { decrement: 1 }
            }
        });
        res.status(204).json();
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Found": "Try Delete" });
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
            // Should not specify both started and ended
            if (started && ended) {
                return res.status(400).json({ "Bad Request": "Both started and ended exist" });
            }
            // Filter promotions that have started already or not started
            if (started) {
                if (started === "true") {
                    where.startTime = { lt: (new Date()).toISOString() };
                }
                else {
                    where.startTime = { gte: (new Date()).toISOString() };
                }
            }
            // Filter promtions that have ended already or not ended
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
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paged = activePromotions.slice(startIndex, endIndex);

            return res.status(200).json({
                count: activePromotions.length,
                results: paged,
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
        if (!Number.isInteger(promotionId) || promotionId <= 0) {
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
        // check original time
        let originalPromotion;
        try {
            originalPromotion = await prisma.promotion.findUnique({
                where: {
                    id: promotionId
                }
            });
        } catch (error) {
            console.log(error);
            return res.status(499).json({ message: "Failed to find promotion" });
        }
        if (!originalPromotion) {
            return res.status(404).json({ "Not Found": "Promotion not found" });
        }
        const originalStartDate = new Date(originalPromotion.startTime);
        const originalEndDate = new Date(originalPromotion.endTime);
        const now = new Date();
        // if update to name/description/type/startTime/minSpending/rate/points, recheck original startime
        if (data.name || data.description || data.type || data.startTime || data.minSpending || data.rate || data.points) {
            if (now >= originalStartDate) {
                return res.status(400).json({ "Bad Request": "Original start time has passed" });
            }
        }
        // if update to endTime, recheck original endtime
        if (data.endTime) {
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
            var result = await prisma.promotion.delete({
                where: {
                    id: promotionId
                }
            });
        } catch (error) {
            console.log(error);
            return res.status(404).json({ message: "Failed to delete promotion becuae not Found the promotion" });
        }
        const startDate = new Date(result.startTime);
        const now = new Date();
        if (now >= startDate) {
            return res.status(403).json({ "Bad Request": "Cannot delete started promotion" });
        }
        return res.status(204).json({ "Success": "No Content" });
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Get & Patch & Delete" });
    });
app.route("/transactions")
    .post(bearerToken, async (req, res) => {
        //check authroizationf first
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // check the role
        if (req.role != "cashier" && req.role != "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Not permitted to create a transactions" });
        }
        // check the data
        // both purchase transacation and adjustment transaction require utorid and type
        let data = {};
        const { utorid, type, spent, promotionIds, remark, amount, relatedId } = req.body;
        if (!utorid || typeof (utorid) !== 'string') {
            return res.status(400).json({ "Bad Request": "Invalid utorid" });
        }
        if (!type || typeof (type) !== 'string') {
            return res.status(400).json({ "Bad Request": "Invalid type" });
        }
        if (type !== "purchase" && type !== "adjustment") {
            return res.status(400).json({ "Bad Request": "type must be 'purchase' or 'adjustment'" });
        }
        data.utorid = utorid;
        data.type = type;
        // promotionIds and remark are optional for both purchase transcation and adjustment transaction
        if (promotionIds) {
            if (!Array.isArray(promotionIds)) {
                return res.status(400).json({ "Bad Request": "Invalid PromotionIds" });
            }
            // check if the promotion IDs does not exist
            const existingPromotions = await prisma.promotion.findMany({
                where: {
                    id: { in: promotionIds }
                }
            });
            if (existingPromotions.length !== promotionIds.length) {
                return res.status(400).json({ "Bad Request": "One or more promotionIds are invalid" });
            }
            // check if the promotion is expired
            const now = new Date();
            for (const promo of existingPromotions) {
                const endDate = new Date(promo.endTime);
                const startDate = new Date(promo.startTime);
                if (now > endDate) {
                    return res.status(400).json({ "Bad Request": `Promotion with id ${promo.id} is expired` });
                }
                if (now < startDate) {
                    return res.status(400).json({ "Bad Request": `Promotion with id ${promo.id} is not started yet` });
                }
            }
            // check if the promotion has been used alredy
            const userData = await prisma.user.findUnique({
                where: { utorid: utorid },
                include: { promotions: { select: { id: true } } },
            });
            for (const promotionid of promotionIds) {
                if (!userData.promotions.some(promo => promo.id === promotionid)) {
                    return res.status(400).json({ "Bad Request": `Promotion with id ${promotionid} has been used` });
                }
            }
            // promotionIds are valid
            data.promotionIds = { connect: promotionIds.map(id => ({ id })) };
        }
        if (remark) {
            if (typeof (remark) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid remark" });
            }
            data.remark = remark;
        }
        // check who created this transaction
        const createdBy = req.user.id;
        data.createdby = String(createdBy);
        // extra field
        const allowedFields = ["utorid", "type", "spent", "promotionIds", "remark", "amount", "relatedId"];
        const extraFields = Object.keys(req.body).filter((field) => {
            return !allowedFields.includes(field);
        });
        if (extraFields.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraFields,
            });
        }
        if (type === "purchase") {
            // role gate for purchase: cashier OR manager OR superuser
            if (!(req.role === "cashier" || req.role === "manager" || req.role === "superuser")) {
                return res.status(403).json({ "Forbidden": "Not permitted to create purchase transaction" });
            }
            // spent required for purchase
            if (!spent || typeof spent !== "number" || isNaN(spent) || spent <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid spent" });
            }
            data.spent = spent;
            // compute earned: 1 point per $0.25 
            const earned = Math.round(spent * 4);
            data.earned = earned;
            // create purchase transaction
            const created = await prisma.transaction.create({
                data: data,
                include: { promotionIds: { select: { id: true } } }
            });
            data.promotionIds = created.promotionIds;
            data.id = created.id;
            // add points to user
            await prisma.user.update({
                where: { utorid: utorid },
                data: { points: { increment: earned } }
            });
            return res.status(201).json(data);
        } else if (type === "adjustment") {
            if (!amount || typeof amount !== "number" || !Number.isInteger(amount) || amount === 0) {
                return res.status(400).json({ "Bad Request": "Invalid amount" });
            }
            if (!relatedId || typeof relatedId !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid relatedId" });
            }
            data.amount = amount;
            data.relatedId = relatedId;
            // create adjustment transaction
            const created = await prisma.transaction.create({
                data: data,
                include: { promotionIds: { select: { id: true } } }
            });
            data.promotionIds = created.promotionIds;
            data.id = created.id;
            // adjust points to user
            await prisma.user.update({
                where: { utorid: utorid },
                data: { points: { increment: amount } }
            });
            return res.status(201).json(data);
        }
    })
    .get(bearerToken, async (req, res) => {
        //check authroizationf first
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // check the role
        if (req.role != "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Not permitted to view transactions" });
        }
        // process query parameters
        const { name, createdBy, suspicious, promotionId, type, relatedId, amount, operator, page, limit } = req.query;
        const filters = {};
        if (name) {
            if (typeof (name) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid name" });
            }
            filters.utorid = name;
        }
        if (createdBy) {
            if (typeof (createdBy) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid createdBy" });
            }
            filters.createdby = createdBy;
        }
        if (suspicious !== undefined && suspicious !== null) {
            if (suspicious !== "true" && suspicious !== "false") {
                return res.status(400).json({ "Bad Request": "Invalid suspicious" });
            }
            filters.suspicious = (suspicious === "true");
        }
        if (type) {
            if (typeof (type) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid type" });
            }
            filters.type = type;
        }
        // relatedId must be used with type 
        if (relatedId) {
            if (!type) {
                return res.status(400).json({ "Bad Request": "relatedId must be used with type adjustment" });
            }
            if (typeof (relatedId) !== "number" || isNaN(relatedId)) {
                return res.status(400).json({ "Bad Request": "Invalid relatedId" });
            }
            filters.relatedId = relatedId;
        }
        // amount must be used with operator
        if (amount) {
            if (!operator) {
                return res.status(400).json({ "Bad Request": "Missing operator" });
            }
            if (typeof (operator) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid operator" });
            }
            if (operator !== "gt" && operator !== "lt") {
                return res.status(400).json({ "Bad Request": "Invalid operator" });
            }
            filters.operator = operator;
            if (isNaN(parseInt(amount))) {
                return res.status(400).json({ "Bad Request": "Invalid amount" });
            }
            const amt = parseInt(amount);
            filters.amount = amt;
        }
        if (operator && !amount) {
            return res.status(400).json({ "Bad Request": "Missing amount" });
        }
        if (page) {
            if (isNaN(parseInt(page)) || parseInt(page) <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid page" });
            }
        } else {
            page = 1;
        }
        if (limit) {
            if (isNaN(parseInt(limit)) || parseInt(limit) <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid limit" });
            }
        } else {
            limit = 10;
        }
        // extra params
        const allowedParams = ["name", "createdBy", "suspicious", "promotionId", "type", "relatedId", "amount", "operator", "page", "limit"];
        const extraParams = Object.keys(req.query).filter((paramas) => {
            return !allowedParams.includes(paramas);
        });
        if (extraParams.length > 0) {
            return res.status(400).json({
                "Bad Request": "Include extra fields",
                extraParams,
            });
        }
        // retrieve transactions
        const result = await prisma.transaction.findMany({
            where: filters,
            skip: (page - 1) * limit,
            take: parseInt(limit),
            include: { promotionIds: { select: { id: true } } }
        });
        return res.status(200).json({
            count: result.length,
            results: result
        });
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Post" });
    });

app.route("/transactions/:transactionId")
    .get(bearerToken, async (req, res) => {
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        if (req.role != "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Not permitted to view transactions" });
        }
        const id = Number(req.params.transactionId);
        if (!id || isNaN(id)) {
            return res.status(400).json({ "Bad Request": "Invalid transactionId" });
        }
        const result = await prisma.transaction.findUnique({
            where: { id: id },
            select: {
                id: true,
                utorid: true,
                type: true,
                spent: true,
                amount: true,
                promotionIds: { select: { id: true } },
                suspicious: true,
                remark: true,
                createdby: true
            }
        });
        if (!result) {
            return res.status(404).json({ "Not Found": "Transaction not found" });
        }
        return res.json(result);
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Get" });
    });

app.route("/transactions/:transactionId/suspicious")
    .patch(bearerToken, async (req, res) => {
        // check authorization first
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        if (req.role != "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Not permitted to update suspicious flag" });
        }
        const transactionId = parseInt(req.params.transactionId);
        if (!transactionId || isNaN(transactionId)) {
            return res.status(400).json({ "Bad Request": "Invalid transactionId" });
        }
        const { suspicious } = req.body;
        if (!suspicious) {
            return res.status(400).json({ "Bad Request": "Missing suspicious value" });
        }
        if (typeof suspicious !== "boolean") {
            return res.status(400).json({ "Bad Request": "Invalid suspicious value" });
        }
        if (suspicious === true) {
            // set suspicious to true
            const updateTransaction = await prisma.transaction.update({
                where: { id: transactionId },
                data: { suspicious: true },
                select: {
                    id: true,
                    utorid: true,
                    type: true,
                    spent: true,
                    amount: true,
                    promotionIds: { select: { id: true } },
                    suspicious: true,
                    remark: true,
                    createdby: true
                }
            });
            const deduction = updateTransaction.amount;
            // set user to suspicious
            await prisma.user.update({
                where: { id: req.user.id },
                data: {
                    suspicious: true,
                    points: { decrement: deduction }
                }
            });
            return res.status(200).json(updateTransaction);
        } else {
            // set suspicious to false
            const updateTransaction = await prisma.transaction.update({
                where: { id: transactionId },
                data: { suspicious: false },
                select: {
                    id: true,
                    utorid: true,
                    type: true,
                    spent: true,
                    amount: true,
                    promotionIds: { select: { id: true } },
                    suspicious: true,
                    remark: true,
                    createdby: true
                }
            });
            // set user to not suspicious
            await prisma.user.update({
                where: { id: req.user.id },
                data: {
                    suspicious: false,
                    points: { increment: updateTransaction.amount }
                }
            });
            return res.status(200).json(updateTransaction);
        }
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Patch" });
    });
app.route("/users/me/transactions")
    .post(bearerToken, async (req, res) => {
        // check authorization first
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // check role
        if (req.role != "manager" && req.role !== "superuser" && req.role !== "cashier" && req.role !== "regular") {
            return res.status(403).json({ "Forbidden": "Not permitted to create transactions" });
        }
        // find the user 
        const userData = await prisma.user.findUnique({
            where: { id: req.user.id },
        });
        // check if user is verified or not
        if (userData.verified === false) {
            return res.status(403).json({ "Forbidden": "User not verified" });
        }
        // validate data
        const { type, amount, remark } = req.body;
        let data = {};
        if (!type || typeof (type) !== "string" || type !== "redemption") {
            return res.status(400).json({ "Bad Request": "Invalid type" });
        }
        data.type = type;
        if (!amount || typeof (amount) !== "number" || isNaN(amount) || !Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({ "Bad Request": "Invalid amount" });
        }
        data.amount = amount;
        if (remark) {
            if (typeof (remark) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid remark" });
            }
            data.remark = remark;
        }
        data.createdby = String(req.user.id);
        // check if the user has enough points
        if (userData.points < amount) {
            return res.status(400).json({ "Bad Request": "Insufficient points" });
        }
        // create transaction
        const transaction = await prisma.transaction.create({
            data: data,
            select: {
                id: true,
                utorid: true,
                type: true,
                processedBy: true,
                amount: true,
                remark: true,
                createdby: true
            }
        });
        // redemption transaction must be processed by cashier later though path
    })
    .get(bearerToken, async (req, res) => {
        // check authorization first
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        if (req.role != "manager" && req.role !== "superuser" && req.role !== "cashier" && req.role !== "regular") {
            return res.status(403).json({ "Forbidden": "Not permitted to view transactions" });
        }
        // validat data
        let data = {};
        const { type, relatedId, promotionId, amount, operator, page, limit } = req.query;
        if (type) {
            if (typeof (type) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid type" });
            }
            data.type = type;
        }
        // relatedId must be used with type
        if (relatedId) {
            if (!type) {
                return res.status(400).json({ "Bad Request": "relatedId must be used with type adjustment" });
            }
            if (isNaN(parseInt(relatedId))) {
                return res.status(400).json({ "Bad Request": "Invalid relatedId" });
            }
            data.relatedId = parseInt(relatedId);
        }
        if (promotionId) {
            if (isNaN(parseInt(promotionId))) {
                return res.status(400).json({ "Bad Request": "Invalid promotionId" });
            }
            data.promotionId = parseInt(promotionId);
        }
        // amount must be used with operator
        if (amount) {
            if (!operator) {
                return res.status(400).json({ "Bad Request": "Missing operator" });
            }
            if (isNaN(parseInt(amount))) {
                return res.status(400).json({ "Bad Request": "Invalid amount" });
            }
            data.amount = parseInt(amount);
        }
        if (operator && !amount) {
            return res.status(400).json({ "Bad Request": "Missing amount" });
        }
        if (operator) {
            if (typeof (operator) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid operator" });
            }
            if (operator !== "gt" && operator !== "lt") {
                return res.status(400).json({ "Bad Request": "Invalid operator" });
            }
            data.operator = operator;
        }
        if (page) {
            if (isNaN(parseInt(page)) || parseInt(page) <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid page" });
            }
            data.page = parseInt(page);
        } else {
            data.page = 1;
        }
        if (limit) {
            if (isNaN(parseInt(limit)) || parseInt(limit) <= 0) {
                return res.status(400).json({ "Bad Request": "Invalid limit" });
            }
            data.limit = parseInt(limit);
        } else {
            data.limit = 10;
        }
        data.createdby = String(req.user.id);
        // get the current author
        const transactions = await prisma.transaction.findMany({
            where: { data },
            skip: (data.page - 1) * data.limit,
            take: data.limit,
        });
        return res.status(200).json({
            count: transactions.length,
            results: transactions
        });
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Post & Get" });
    });

app.route("/users/:userId/transactions")
    .post(bearerToken, async (req, res) => {
        // check authorization first
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        // check role
        if (req.role != "manager" && req.role !== "superuser" && req.role !== "cashier" && req.role !== "regular") {
            return res.status(403).json({ "Forbidden": "Not permitted to create transactions" });
        }
        const userId = parseInt(req.params.userId);
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ "Bad Request": "Invalid userId" });
        }
        // check if user is verified or not
        if (req.user.verified === false) {
            return res.status(403).json({ "Forbidden": "User not verified" });
        }
        // validate data
        const { type, amount, remark } = req.body;
        let data = {};
        if (!type || typeof (type) !== "string" || type !== "transfer") {
            return res.status(400).json({ "Bad Request": "Invalid type" });
        }
        data.type = type;
        if (!amount || typeof (amount) !== "number" || isNaN(amount) || !Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({ "Bad Request": "Invalid amount" });
        }
        data.amount = amount;
        if (remark) {
            if (typeof (remark) !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid remark" });
            }
            data.remark = remark;
        }
        data.createdby = String(req.user.id);
        // check if th sender has enough points
        const senderData = await prisma.user.findUnique({
            where: { id: req.user.id },
        });
        if (senderData.points < amount) {
            return res.status(400).json({ "Bad Request": "Insufficient points" });
        }
        // create transaction
        // one for sending the amount and set relatedId to receiver's userId
        data.relatedId = userId;
        const senderTransaction = await prisma.transaction.create({
            data: data,
            select: {
                id: true,
                type: true,
                remark: true,
                createdby: true,
            }
        });
        // deduct points from sender
        await prisma.user.update({
            where: { id: req.user.id },
            data: { points: { decrement: amount } }
        });
        // one for receiving the amount and set relatedId to sender's userId
        data.relatedId = req.user.id;
        const receiverTransaction = await prisma.transaction.create({
            data: data

        });
        // add points to receiver
        await prisma.user.update({
            where: { id: userId },
            data: { points: { increment: amount } }
        });

        return res.status(201).json({
            senderTransaction,
            receiverTransaction
        });
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Post" });
    });

app.route("/transactions/:transactionId/processed")
    .patch(bearerToken, async (req, res) => {
        // check authorization first
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        if (req.role != "manager" && req.role !== "superuser" && req.role !== "cashier") {
            return res.status(403).json({ "Forbidden": "Not permitted to update processed flag" });
        }
        // check if the filed process exists
        const transactionId = parseInt(req.params.transactionId);
        const { processed } = req.body;
        if (!processed || processed === false || typeof processed !== "boolean") {
            return res.status(400).json({ "Bad Request": "Missing processed value" });
        }
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });
        if (!transaction) {
            return res.status(404).json({ "Not Found": "Transaction not found" });
        }
        if (transaction.type !== "redemption") {
            return res.status(400).json({ "Bad Request": "Only redemption transactions can be processed" });
        }
        if (transaction.processed === true) {
            return res.status(400).json({ "Bad Request": "Transaction already processed" });
        }
        // update processed to true
        const updatedTransaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: { processed: true, processedBy: req.user.id },
            select: {
                id: true,
                utorid: true,
                type: true,
                processedBy: true,
                redeemed: true,
                remark: true,
                createdby: true
            }
        });
        // update user's points
        await prisma.user.update({
            where: { utorid: transaction.utorid },
            data: { points: { decrement: transaction.amount } }
        });
        return res.status(200).json(updatedTransaction);
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Patch" });
    });

app.route("/events/:eventId/transactions")
    .post(bearerToken, async (req, res) => {
        // check authorization first
        if (!req.role) {
            return res.status(401).json({ "Unauthorized": "No authorization" });
        }
        if (req.role != "manager" && req.role !== "superuser") {
            return res.status(403).json({ "Forbidden": "Not permitted to create transactions for events" });
        }
        const eventId = parseInt(req.params.eventId);
        const { type, utorid, amount } = req.body;
        if (!eventId || isNaN(eventId)) {
            return res.status(400).json({ "Bad Request": "Invalid eventId" });
        }
        if (!type || typeof type !== "string" || type !== "event") {
            return res.status(400).json({ "Bad Request": "Invalid type" });
        }
        if (!amount || typeof amount !== "number" || isNaN(amount) || !Number.isInteger(amount) || amount <= 0) {
            return res.status(400).json({ "Bad Request": "Invalid amount" });
        }
        // if the guest is not on the guest lsit, return error
        if (utorid && !event.guests.some(guest => guest.utorid === utorid)) {
            return res.status(400).json({ "Bad Request": "Guest not found for event" });
        }
        // if the remainpoint is less than the request amount
        const organizerData = await prisma.user.findUnique({
            where: { id: req.user.id },
        });
        if (organizerData.points < amount) {
            return res.status(400).json({ "Bad Request": "Insufficient points" });
        }
        // if utorid is provided amount is rewarded to the guest
        if (utorid) {
            if (typeof utorid !== "string") {
                return res.status(400).json({ "Bad Request": "Invalid utorid" });
            }
            // create the transaction
            const transaction = await prisma.transaction.create({
                data: {
                    utorid: utorid,
                    type: type,
                    amount: amount,
                    createdby: String(req.user.id),
                },
            });
            // add points to the user
            await prisma.user.update({
                where: { utorid: utorid },
                data: { points: { increment: amount } }
            });
            return res.status(201).json(transaction);
        }
        // if utorid is not provided, amount is awarded to all guests
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { guests: true }
        });
        if (!event) {
            return res.status(404).json({ "Not Found": "Event not found" });
        }
        const guests = event.guests;
        const guestCount = guests.length;
        if (guestCount === 0) {
            return res.status(400).json({ "Bad Request": "No guests found for event" });
        }
        // create the transaction for each guest
        const transactions = await Promise.all(guests.map(async (guest) => {
            return await prisma.transaction.create({
                data: {
                    utorid: guest.utorid,
                    type: type,
                    amount: amount,
                    createdby: String(req.user.id),
                }
            });
        }));
        // add points to each guest
        await Promise.all(guests.map(async (guest) => {
            return await prisma.user.update({
                where: { utorid: guest.utorid },
                data: { points: { increment: amount } }
            });
        }));
        return res.status(201).json(transactions);
    })
    .all((req, res) => {
        res.status(405).json({ "Method Not Allowed": "Try Get" });
    });
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

server.on('error', (err) => {
    console.error(`cannot start server: ${err.message}`);
    process.exit(1);
});